import OpenAI from 'openai'

const client = new OpenAI({
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1', // DeepSeek 官方接口地址
  apiKey: 'sk-280b0f3bcbbc466885a20c9a04609291', // 替换为你的 API Key
})

export default defineEventHandler(async event => {
  try {
    const data = await readBody(event)
    const { question } = JSON.parse(data)
    console.log('\x1B[44m\x1B[33mrequest\x1B[0m', {
      model: 'qwen-max',
      messages: [{ role: 'user', content: question }],
    })
    const response = await client.chat.completions.create({
      model: 'qwen-max',
      messages: [{ role: 'user', content: question }],
      temperature: 0.5,
      stream: true,
    })
    event.node.res.setHeader('Content-Type', 'text/event-stream')
    event.node.res.setHeader('Cache-Control', 'no-cache')
    event.node.res.setHeader('Connection', 'keep-alive')
    // 逐块转发 OpenAI 流数据
    for await (const chunk of response) {
      const content = chunk.choices[0]?.delta?.content || ''
      // 封装成sse的格式
      event.node.res.write(`data: ${JSON.stringify({ text: content })}\n\n`)
    }
    event.node.res.end()
  } catch (error) {
    console.error('Error:', error)
    return { error: 'An error occurred' }
  }
})
