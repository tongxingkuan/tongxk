import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import type { Response } from 'express'
import { Repository } from 'typeorm'
import { LlmService, type ChatMessage } from '../llm/llm.service'
import { KnowledgeService } from '../knowledge/knowledge.service'
import { RedisService } from '../redis/redis.service'
import { findCharacter } from './characters'
import { ConversationEntity } from './entities/conversation.entity'
import { MessageEntity } from './entities/message.entity'
import { StreamBuffer } from './stream-buffer'

/** 每用户每分钟最多发消息数（Redis 限流，固定窗口） */
const RATE_LIMIT = 20

/** 分段落库间隔（ms），刷新/重启时不丢已生成内容 */
const FLUSH_INTERVAL = 500

@Injectable()
export class ChatsService {
  /** 进行中的流式任务缓冲：messageId → StreamBuffer */
  private readonly buffers = new Map<string, StreamBuffer>()

  constructor(
    @InjectRepository(ConversationEntity)
    private readonly conversations: Repository<ConversationEntity>,
    @InjectRepository(MessageEntity)
    private readonly messages: Repository<MessageEntity>,
    private readonly llm: LlmService,
    private readonly knowledge: KnowledgeService,
    private readonly redis: RedisService,
  ) {}

  async create(userId: string): Promise<ConversationEntity> {
    const conv = await this.conversations.save(this.conversations.create({ userId, title: '新对话' }))
    await this.invalidateListCache(userId)
    return conv
  }

  async list(userId: string): Promise<ConversationEntity[]> {
    const key = `chats:list:${userId}`
    const cached = await this.redis.get(key)
    if (cached) return JSON.parse(cached) as ConversationEntity[]

    const list = await this.conversations.find({
      where: { userId },
      order: { updatedAt: 'DESC' },
      select: ['id', 'title', 'createdAt', 'updatedAt'],
    })
    await this.redis.set(key, JSON.stringify(list), 60)
    return list
  }

  async findById(id: string, userId: string): Promise<ConversationEntity | null> {
    const conv = await this.conversations.findOne({
      where: { id, userId },
      relations: { messages: true },
    })
    if (!conv) return null
    conv.messages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    return conv
  }

  async updateTitle(id: string, userId: string, title: string): Promise<ConversationEntity> {
    const conv = await this.conversations.findOne({ where: { id, userId } })
    if (!conv) throw new NotFoundException('对话不存在')
    conv.title = title
    const saved = await this.conversations.save(conv)
    await this.invalidateListCache(userId)
    return saved
  }

  async remove(id: string, userId: string): Promise<void> {
    const conv = await this.conversations.findOne({ where: { id, userId } })
    if (!conv) throw new NotFoundException('对话不存在')
    await this.conversations.remove(conv)
    await this.invalidateListCache(userId)
  }

  /**
   * 发送消息并以 SSE 流式返回 assistant 回复。
   * LLM 流与 SSE 连接解耦：先建 generating 消息 + StreamBuffer，再异步消费 LLM；
   * 前端断开不影响生成，刷新后可通过 resumeMessage 续传。
   */
  async streamMessage(id: string, userId: string, content: string, res: Response, character?: string): Promise<void> {
    await this.checkRateLimit(userId)

    const conv = await this.conversations.findOne({ where: { id, userId } })
    if (!conv) throw new NotFoundException('对话不存在')

    await this.messages.save(this.messages.create({ conversationId: id, role: 'user', content }))

    const history = await this.messages.find({
      where: { conversationId: id },
      order: { createdAt: 'ASC' },
    })
    const llmMessages: ChatMessage[] = history.map(m => ({
      role: m.role,
      content: m.content,
    }))

    // RAG：仅当用户开启全局开关时，检索该用户的知识库片段注入 system
    if (await this.knowledge.getRagEnabled(userId)) {
      const snippets = await this.knowledge.search(userId, content)
      if (snippets.length) {
        const context = snippets.map((s, i) => `[${i + 1}] ${s}`).join('\n')
        llmMessages.unshift({
          role: 'system',
          content: `以下是从知识库检索到的相关内容，供参考回答：\n${context}`,
        })
      }
    }

    // 角色系统提示词：每次请求注入到历史最前，手动干预模型行为
    const preset = findCharacter(character)
    if (preset?.systemPrompt) {
      llmMessages.unshift({ role: 'system', content: preset.systemPrompt })
    }

    // 先建 generating 的 assistant 消息，拿到 id 供前端续传
    const assistant = await this.messages.save(
      this.messages.create({ conversationId: id, role: 'assistant', content: '', status: 'generating' }),
    )
    const buffer = new StreamBuffer()
    this.buffers.set(assistant.id, buffer)

    this.writeSseHeaders(res)
    const send = (data: unknown) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`)
    }
    send({ messageId: assistant.id })

    // 当前连接订阅 buffer（offset 0）；前端断开仅取消订阅，LLM 继续
    const unsub = buffer.subscribe(
      0,
      delta => send({ content: delta }),
      err => {
        if (err) send({ error: err })
        else send({ done: true })
        res.end()
      },
    )
    res.on('close', () => unsub())

    // 异步消费 LLM 流，不阻塞响应
    void this.consumeLlm(assistant.id, id, userId, llmMessages, buffer)
  }

  /** 消费 LLM 流写入 buffer 并分段落库；结束后标记 done 并清理缓冲。 */
  private async consumeLlm(
    assistantId: string,
    conversationId: string,
    userId: string,
    messages: ChatMessage[],
    buffer: StreamBuffer,
  ): Promise<void> {
    let full = ''
    let lastFlush = 0
    try {
      for await (const delta of this.llm.streamChat(messages)) {
        full += delta
        buffer.append(delta)
        const now = Date.now()
        if (now - lastFlush > FLUSH_INTERVAL) {
          lastFlush = now
          await this.messages.update({ id: assistantId }, { content: full })
        }
      }
      await this.messages.update({ id: assistantId }, { content: full, status: 'done' })
      buffer.finish()
    } catch (err) {
      await this.messages.update({ id: assistantId }, { content: full, status: 'done' }).catch(() => {})
      buffer.finish(err instanceof Error ? err.message : 'LLM 调用失败')
    } finally {
      this.buffers.delete(assistantId)
      // 更新对话时间，使列表排序刷新
      await this.conversations.update({ id: conversationId }, { updatedAt: new Date() }).catch(() => {})
      await this.invalidateListCache(userId)
    }
  }

  /**
   * 刷新后续传：对 generating 中的 assistant 消息，回放已缓存 delta 并续接实时输出。
   * 若缓冲已不存在（流已结束/异常中断），兜底返回已落库内容并标记 done。
   */
  async resumeMessage(id: string, messageId: string, userId: string, res: Response): Promise<void> {
    const conv = await this.conversations.findOne({ where: { id, userId } })
    if (!conv) throw new NotFoundException('对话不存在')
    const msg = await this.messages.findOne({ where: { id: messageId, conversationId: id } })
    if (!msg) throw new NotFoundException('消息不存在')

    this.writeSseHeaders(res)
    const send = (data: unknown) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`)
    }

    const buffer = this.buffers.get(messageId)
    if (buffer) {
      // 流仍在进行：回放全部已缓存 delta + 续接实时
      const unsub = buffer.subscribe(
        0,
        delta => send({ content: delta }),
        err => {
          if (err) send({ error: err })
          else send({ done: true })
          res.end()
        },
      )
      res.on('close', () => unsub())
      return
    }

    // 缓冲已不存在：异常中断的 generating 兜底标记 done
    if (msg.status === 'generating') {
      await this.messages.update({ id: messageId }, { status: 'done' })
    }
    if (msg.content) send({ content: msg.content })
    send({ done: true })
    res.end()
  }

  private writeSseHeaders(res: Response): void {
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')
    res.flushHeaders?.()
  }

  private async checkRateLimit(userId: string): Promise<void> {
    const minuteKey = `rl:msg:${userId}:${Math.floor(Date.now() / 60000)}`
    const count = await this.redis.incrWithTtl(minuteKey, 60)
    if (count > RATE_LIMIT) {
      throw new HttpException('请求过于频繁，请稍后再试', HttpStatus.TOO_MANY_REQUESTS)
    }
  }

  private async invalidateListCache(userId: string): Promise<void> {
    await this.redis.delByPrefix(`chats:list:${userId}`)
  }
}
