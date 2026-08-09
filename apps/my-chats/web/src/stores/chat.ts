import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as chatsApi from '../api/chats'
import type { Character, Conversation, Message } from '../api/types'

export const useChatStore = defineStore('chat', () => {
  const conversations = ref<Conversation[]>([])
  const current = ref<Conversation | null>(null)
  const messages = ref<Message[]>([])
  const sending = ref(false)
  let abortCtrl: AbortController | null = null
  const characters = ref<Character[]>([])
  const currentCharacter = ref('default')

  async function loadConversations() {
    conversations.value = await chatsApi.listConversations()
  }

  async function loadCharacters() {
    characters.value = await chatsApi.listCharacters()
  }

  async function newConversation() {
    const conv = await chatsApi.createConversation()
    conversations.value.unshift(conv)
    await selectConversation(conv.id)
    return conv
  }

  /** 放弃当前对话的实时流并复位 sending；服务端仍继续生成，切回后靠 resume 续传 */
  function stopStream() {
    abortCtrl?.abort()
    abortCtrl = null
    sending.value = false
  }

  async function selectConversation(id: string) {
    stopStream()
    const conv = await chatsApi.getConversation(id)
    current.value = conv
    messages.value = conv.messages ?? []
    // 刷新恢复：最后一条 assistant 仍在生成则续传
    const last = messages.value[messages.value.length - 1]
    if (last && last.role === 'assistant' && last.status === 'generating') {
      void resumeMessage(id, last)
    }
  }

  async function renameConversation(id: string, title: string) {
    const updated = await chatsApi.updateTitle(id, title)
    const idx = conversations.value.findIndex(c => c.id === id)
    if (idx >= 0) conversations.value[idx] = { ...conversations.value[idx], ...updated }
    if (current.value?.id === id) current.value = { ...current.value, ...updated }
  }

  async function removeConversation(id: string) {
    await chatsApi.removeConversation(id)
    conversations.value = conversations.value.filter(c => c.id !== id)
    if (current.value?.id === id) {
      stopStream()
      current.value = null
      messages.value = []
    }
  }

  /** 发送消息：立即追加 user 消息，SSE 流式追加 assistant 消息 */
  async function sendMessage(content: string) {
    if (!current.value || sending.value) return
    const conversationId = current.value.id

    messages.value.push({
      id: `local-${Date.now()}`,
      conversationId,
      role: 'user',
      status: 'done',
      content,
      createdAt: new Date().toISOString(),
    })

    messages.value.push({
      id: `local-a-${Date.now()}`,
      conversationId,
      role: 'assistant',
      status: 'generating',
      content: '',
      createdAt: new Date().toISOString(),
    })
    // 取代理引用：直接修改原始对象不触发响应式，必须通过 reactive 代理改 content
    const assistant = messages.value[messages.value.length - 1]
    abortCtrl = new AbortController()
    sending.value = true

    await chatsApi.streamMessage(
      conversationId,
      content,
      currentCharacter.value,
      {
        onMessageId: id => {
          assistant.id = id
        },
        onDelta: delta => {
          assistant.content += delta
        },
        onDone: () => {
          assistant.status = 'done'
          sending.value = false
          abortCtrl = null
          // 首条消息后用内容前缀更新对话标题（流被中断不会走到这里，故 current 必为本对话）
          if (current.value && current.value.title === '新对话') {
            const title = content.slice(0, 20) || '新对话'
            void renameConversation(current.value.id, title)
          }
          void loadConversations()
        },
        onError: message => {
          assistant.content = assistant.content ? `${assistant.content}\n\n[错误: ${message}]` : `[错误: ${message}]`
          assistant.status = 'done'
          sending.value = false
          abortCtrl = null
        },
      },
      abortCtrl.signal,
    )
  }

  /** 刷新后续传：清空已落库部分重新累积，接续剩余流式输出 */
  async function resumeMessage(conversationId: string, msg: Message) {
    if (sending.value) return
    abortCtrl = new AbortController()
    sending.value = true
    msg.content = ''
    await chatsApi.resumeMessage(
      conversationId,
      msg.id,
      {
        onDelta: delta => {
          msg.content += delta
        },
        onDone: () => {
          msg.status = 'done'
          sending.value = false
          abortCtrl = null
          void loadConversations()
        },
        onError: message => {
          msg.content = msg.content ? `${msg.content}\n\n[错误: ${message}]` : `[错误: ${message}]`
          msg.status = 'done'
          sending.value = false
          abortCtrl = null
        },
      },
      abortCtrl.signal,
    )
  }

  return {
    conversations,
    current,
    messages,
    sending,
    characters,
    currentCharacter,
    loadConversations,
    loadCharacters,
    newConversation,
    selectConversation,
    renameConversation,
    removeConversation,
    sendMessage,
  }
})
