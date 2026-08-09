import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ChatOpenAI } from '@langchain/openai'
import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages'
import type { BaseMessage } from '@langchain/core/messages'
import { llmConfig, type LlmConfig } from '../config/llm.config'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

function toLangChainMessage(m: ChatMessage): BaseMessage {
  if (m.role === 'system') return new SystemMessage(m.content)
  if (m.role === 'user') return new HumanMessage(m.content)
  return new AIMessage(m.content)
}

@Injectable()
export class LlmService implements OnModuleInit {
  private model!: ChatOpenAI

  constructor(@Inject(llmConfig.KEY) private readonly config: LlmConfig) {}

  onModuleInit(): void {
    if (!this.config.apiKey) {
      throw new Error('LLM_API_KEY 未配置，请在 server/.env 设置智谱 API Key（见 .env.example）')
    }
    // 文档方案：用 LangChain 的 ChatOpenAI（OpenAI 兼容）指向智谱端点
    this.model = new ChatOpenAI({
      model: this.config.model,
      apiKey: this.config.apiKey,
      configuration: { baseURL: this.config.baseUrl },
      temperature: 0.6,
      streaming: true,
    })
  }

  /**
   * 通过 LangChain 流式调用智谱 GLM，逐 chunk yield 增量文本。
   */
  async *streamChat(messages: ChatMessage[]): AsyncGenerator<string> {
    const stream = await this.model.stream(messages.map(toLangChainMessage))
    for await (const chunk of stream) {
      const delta = typeof chunk.content === 'string' ? chunk.content : ''
      if (delta) yield delta
    }
  }
}
