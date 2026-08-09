import { apiFetch, getToken } from './http'

export interface KnowledgeBase {
  id: string
  name: string
  createdAt: string
}

export interface UploadResult {
  filename: string
  chunks: number
}

function authHeaders(): Record<string, string> {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export function listBases() {
  return apiFetch('/api/knowledge/bases', { headers: authHeaders() }).then(
    res => res.json() as Promise<KnowledgeBase[]>,
  )
}

export function createBase(name: string) {
  return apiFetch('/api/knowledge/bases', {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  }).then(res => res.json() as Promise<KnowledgeBase>)
}

export function removeBase(id: string) {
  return apiFetch(`/api/knowledge/bases/${id}`, { method: 'DELETE', headers: authHeaders() })
}

/** 上传 .md/.txt 文档到指定知识库（切块 + 向量化） */
export async function uploadDocument(baseId: string, file: File): Promise<UploadResult> {
  const formData = new FormData()
  formData.append('file', file)
  const res = await apiFetch(`/api/knowledge/bases/${baseId}/documents`, {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  })
  if (!res.ok) {
    const msg = (await res.json().catch(() => ({}))) as { message?: string }
    throw new Error(msg.message ?? `上传失败 (${res.status})`)
  }
  return res.json() as Promise<UploadResult>
}

export async function getRag(): Promise<boolean> {
  const res = await apiFetch('/api/knowledge/rag', { headers: authHeaders() })
  const data = (await res.json()) as { enabled: boolean }
  return data.enabled
}

export function setRag(enabled: boolean) {
  return apiFetch('/api/knowledge/rag', {
    method: 'PUT',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled }),
  })
}
