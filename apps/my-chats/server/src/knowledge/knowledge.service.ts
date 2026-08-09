import { Inject, Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { PGVectorStore } from '@langchain/community/vectorstores/pgvector'
import { OpenAIEmbeddings } from '@langchain/openai'
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'
import { Repository } from 'typeorm'
import { databaseConfig, type DatabaseConfig } from '../config/database.config'
import { llmConfig, type LlmConfig } from '../config/llm.config'
import { UserEntity } from '../auth/entities/user.entity'
import { KnowledgeBaseEntity } from './entities/knowledge-base.entity'

/** 向量存储表名（所有用户共用一张表，按 metadata 区分） */
const TABLE = 'knowledge_vectors'
/** 每次检索返回的片段数 */
const TOP_K = 4

@Injectable()
export class KnowledgeService implements OnModuleInit {
  private readonly logger = new Logger(KnowledgeService.name)
  private store: PGVectorStore | null = null
  private readonly splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  })

  constructor(
    @Inject(databaseConfig.KEY) private readonly db: DatabaseConfig,
    @Inject(llmConfig.KEY) private readonly llm: LlmConfig,
    @InjectRepository(KnowledgeBaseEntity)
    private readonly bases: Repository<KnowledgeBaseEntity>,
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      const embeddings = new OpenAIEmbeddings({
        model: this.llm.embeddingModel,
        apiKey: this.llm.apiKey,
        configuration: { baseURL: this.llm.baseUrl },
        // 不传 dimensions：智谱 embedding-3 经 openai SDK 的 dimensions 参数行为异常
        // （实际维度恒为配置值的 1/4），改用模型默认输出，下方探测真实维度建表
      })
      const dimensions = (await embeddings.embedQuery('init')).length
      this.store = await PGVectorStore.initialize(embeddings, {
        postgresConnectionOptions: {
          host: this.db.host,
          port: this.db.port,
          user: this.db.username,
          password: this.db.password,
          database: this.db.database,
        },
        tableName: TABLE,
        distanceStrategy: 'cosine',
        dimensions,
      })
      this.logger.log(`向量库就绪，embedding 维度 = ${dimensions}`)
    } catch (err) {
      // 初始化失败不阻断应用启动，RAG 降级禁用
      this.logger.error(`向量库初始化失败，RAG 降级禁用：${err instanceof Error ? err.message : String(err)}`)
    }
  }

  // ---- 知识库 CRUD ----

  createBase(userId: string, name: string): Promise<KnowledgeBaseEntity> {
    return this.bases.save(this.bases.create({ userId, name }))
  }

  listBases(userId: string): Promise<KnowledgeBaseEntity[]> {
    return this.bases.find({ where: { userId }, order: { createdAt: 'DESC' } })
  }

  /** 删除知识库及其全部向量数据 */
  async deleteBase(userId: string, baseId: string): Promise<void> {
    const base = await this.bases.findOne({ where: { id: baseId, userId } })
    if (!base) throw new NotFoundException('知识库不存在')
    await this.bases.delete({ id: baseId, userId })
    // 删除该库的所有向量（向量库不可用时跳过）
    await this.store?.delete({ filter: { kbId: baseId } })
  }

  // ---- 文档上传（切块 + 向量化） ----

  /** 将文档切块并索引到指定知识库，返回切片数 */
  async indexDocument(userId: string, baseId: string, filename: string, content: string): Promise<number> {
    const base = await this.bases.findOne({ where: { id: baseId, userId } })
    if (!base) throw new NotFoundException('知识库不存在')
    if (!this.store) throw new Error('向量库未初始化，请检查 pgvector 扩展与 embedding 配置')
    const chunks = await this.splitter.splitText(content)
    if (chunks.length === 0) return 0
    await this.store.addDocuments(chunks.map(c => ({ pageContent: c, metadata: { userId, kbId: baseId, filename } })))
    return chunks.length
  }

  // ---- 检索（该用户全部知识库） ----

  /** 检索与 query 最相关的 top-k 片段；向量库不可用或开关关闭时返回空 */
  async search(userId: string, query: string, k = TOP_K): Promise<string[]> {
    if (!this.store) return []
    const docs = await this.store.similaritySearch(query, k, { userId })
    return docs.map(d => d.pageContent)
  }

  // ---- RAG 全局开关（用户偏好） ----

  async getRagEnabled(userId: string): Promise<boolean> {
    const user = await this.users.findOne({ where: { id: userId }, select: ['ragEnabled'] })
    return user?.ragEnabled ?? false
  }

  async setRagEnabled(userId: string, enabled: boolean): Promise<void> {
    // 用 update 避免 select:false 的 passwordHash 被覆盖
    await this.users.update({ id: userId }, { ragEnabled: enabled })
  }
}
