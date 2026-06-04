const VISITOR_KEY = 'txk_visitor_id'
const SESSION_KEY = 'txk_session_id'

function uuid() {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function getVisitorId() {
  let id = localStorage.getItem(VISITOR_KEY)
  if (!id) {
    id = uuid()
    localStorage.setItem(VISITOR_KEY, id)
  }
  return id
}

export function getSessionId() {
  let id = sessionStorage.getItem(SESSION_KEY)
  if (!id) {
    id = uuid()
    sessionStorage.setItem(SESSION_KEY, id)
  }
  return id
}
