import { apiFetch, getToken } from './http'
import type { Character, Conversation } from './types'

export function listConversations() {
  return apiFetch('/api/chats', { headers: authHeaders() }).then(res => res.json() as Promise<Conversation[]>)
}

export function listCharacters() {
  return apiFetch('/api/chats/characters', { headers: authHeaders() }).then(res => res.json() as Promise<Character[]>)
}

export function createConversation() {
  return apiFetch('/api/chats', { method: 'POST', headers: authHeaders() }).then(
    res => res.json() as Promise<Conversation>,
  )
}

export function getConversation(id: string) {
  return apiFetch(`/api/chats/${id}`, { headers: authHeaders() }).then(res => res.json() as Promise<Conversation>)
}

export function updateTitle(id: string, title: string) {
  return apiFetch(`/api/chats/${id}`, {
    method: 'PATCH',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  }).then(res => res.json() as Promise<Conversation>)
}

export function removeConversation(id: string) {
  return apiFetch(`/api/chats/${id}`, { method: 'DELETE', headers: authHeaders() })
}

function authHeaders(): Record<string, string> {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export interface StreamCallbacks {
  onMessageId?: (id: string) => void
  onDelta: (delta: string) => void
  onDone: () => void
  onError: (message: string) => void
}

/** 解析 SSE 流，按事件分发到回调 */
async function readSse(res: Response, cb: StreamCallbacks): Promise<void> {
  if (!res.ok || !res.body) {
    cb.onError(`请求失败 (${res.status})`)
    return
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })

      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data:')) continue
        const data = trimmed.slice(5).trim()
        if (!data) continue
        try {
          const json = JSON.parse(data) as {
            messageId?: string
            content?: string
            done?: boolean
            error?: string
          }
          if (json.messageId) cb.onMessageId?.(json.messageId)
          if (json.content) cb.onDelta(json.content)
          if (json.done) cb.onDone()
          if (json.error) cb.onError(json.error)
        } catch {
          // 解析失败的行跳过
        }
      }
    }
  } catch (err) {
    // 主动中断（切换对话）静默退出；其余读取异常才上报
    if (err instanceof Error && err.name === 'AbortError') return
    cb.onError(err instanceof Error ? err.message : '读取失败')
  }
}

/** 发送消息并以 SSE 流式接收 assistant 回复 */
export async function streamMessage(
  conversationId: string,
  content: string,
  character: string,
  cb: StreamCallbacks,
  signal?: AbortSignal,
): Promise<void> {
  let res: Response
  try {
    res = await apiFetch(`/api/chats/${conversationId}/messages`, {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, character }),
      signal,
    })
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') return
    cb.onError('请求失败')
    return
  }
  await readSse(res, cb)
}

/** 刷新后续传：恢复生成中的 assistant 消息 SSE 流 */
export async function resumeMessage(
  conversationId: string,
  messageId: string,
  cb: StreamCallbacks,
  signal?: AbortSignal,
): Promise<void> {
  let res: Response
  try {
    res = await apiFetch(`/api/chats/${conversationId}/messages/${messageId}/resume`, {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      signal,
    })
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') return
    cb.onError('请求失败')
    return
  }
  await readSse(res, cb)
}
