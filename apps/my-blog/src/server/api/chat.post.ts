// 通过 Nuxt server route 转发到自部署 Ollama，转换为前端约定的 SSE 格式：
//   data: {"text": "..."}\n\n
// 配置（env）：
//   NUXT_OLLAMA_BASE_URL  例: https://ollama.xxx.com
//   NUXT_OLLAMA_MODEL     例: glm-5.1
//   NUXT_OLLAMA_API_KEY   反代鉴权用的 Bearer token
interface OllamaChunk {
  message?: { content?: string }
  done?: boolean
  error?: string
}

interface ChatRequestBody {
  question?: string
}

export default defineEventHandler(async event => {
  const config = useRuntimeConfig()
  const baseUrl = (config.ollamaBaseUrl || '').replace(/\/+$/, '')
  const model = config.ollamaModel || 'glm-5.1'
  const apiKey = config.ollamaApiKey || ''

  if (!baseUrl) {
    setResponseStatus(event, 500)
    return { error: 'NUXT_OLLAMA_BASE_URL 未配置' }
  }

  // 兼容老前端：body 既可能是已 stringify 的字符串，也可能是 JSON 对象
  const raw = await readBody<ChatRequestBody | string>(event)
  const body: ChatRequestBody = typeof raw === 'string' ? JSON.parse(raw) : (raw ?? {})
  const question: string = body?.question ?? ''
  if (!question) {
    setResponseStatus(event, 400)
    return { error: 'question 必填' }
  }

  console.log('\x1B[44m\x1B[33m[ollama]\x1B[0m', { baseUrl, model, question })

  // 调 Ollama /api/chat（NDJSON 流）
  const upstream = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({
      model,
      stream: true,
      messages: [{ role: 'user', content: question }],
      options: { temperature: 0.5 },
    }),
  })

  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text().catch(() => '')
    setResponseStatus(event, upstream.status || 502)
    return { error: `ollama upstream ${upstream.status}: ${text.slice(0, 500)}` }
  }

  // 设置 SSE 响应头
  event.node.res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
  event.node.res.setHeader('Cache-Control', 'no-cache')
  event.node.res.setHeader('Connection', 'keep-alive')
  // Nginx/反代下避免缓冲
  event.node.res.setHeader('X-Accel-Buffering', 'no')

  const reader = upstream.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''

  const writeSSE = (payload: object) => {
    event.node.res.write(`data: ${JSON.stringify(payload)}\n\n`)
  }

  // 客户端断开时停止读上游，防止泄漏
  event.node.req.on('close', () => {
    reader.cancel().catch(() => {})
  })

  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      // Ollama 用 NDJSON：每行一个 JSON
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed) continue
        let chunk: OllamaChunk
        try {
          chunk = JSON.parse(trimmed) as OllamaChunk
        } catch {
          continue
        }
        if (chunk.error) {
          writeSSE({ text: '', error: chunk.error })
          continue
        }
        const text: string = chunk?.message?.content ?? ''
        if (text) writeSSE({ text })
        if (chunk.done) break
      }
    }
    // 处理最后一段残余 buffer
    if (buffer.trim()) {
      try {
        const chunk = JSON.parse(buffer.trim())
        const text: string = chunk?.message?.content ?? ''
        if (text) writeSSE({ text })
      } catch {
        /* ignore */
      }
    }
  } catch (err) {
    console.error('[ollama] stream error:', err)
    writeSSE({ text: '', error: String(err) })
  } finally {
    event.node.res.end()
  }
})
