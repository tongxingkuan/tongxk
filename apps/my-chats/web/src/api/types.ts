export interface PublicUser {
  id: string
  username: string
  createdAt: string
}

export interface Message {
  id: string
  conversationId: string
  role: 'user' | 'assistant'
  status: 'generating' | 'done'
  content: string
  createdAt: string
}

export interface Conversation {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  messages?: Message[]
}

export interface AuthResult {
  token: string
  user: PublicUser
}

export interface Character {
  key: string
  name: string
  description: string
}
