import { registerAs, type ConfigType } from '@nestjs/config'

export const llmConfig = registerAs('llm', () => ({
  baseUrl: process.env.LLM_BASE_URL ?? 'https://open.bigmodel.cn/api/paas/v4',
  apiKey: process.env.LLM_API_KEY ?? '',
  model: process.env.LLM_MODEL ?? 'glm-5.2',
  embeddingModel: process.env.LLM_EMBEDDING_MODEL ?? 'embedding-3',
}))

export type LlmConfig = ConfigType<typeof llmConfig>
