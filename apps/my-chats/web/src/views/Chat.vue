<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ChatInput from '../components/ChatInput.vue'
import MessageBubble from '../components/MessageBubble.vue'
import Sidebar from '../components/Sidebar.vue'
import { useAuthStore } from '../stores/auth'
import { useChatStore } from '../stores/chat'
import { useKnowledgeStore } from '../stores/knowledge'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const chat = useChatStore()
const kb = useKnowledgeStore()

const scrollRef = ref<HTMLDivElement | null>(null)

function scrollToBottom() {
  nextTick(() => {
    if (scrollRef.value) scrollRef.value.scrollTop = scrollRef.value.scrollHeight
  })
}

watch(() => chat.messages.length, scrollToBottom)
watch(() => chat.messages.map(m => m.content).join(''), scrollToBottom)

async function onSend(content: string) {
  await chat.sendMessage(content)
}

async function onLogout() {
  await auth.logout()
  router.push({ name: 'login' })
}

// 当前对话同步到 URL，刷新后可精确回到原对话而非总落到列表第一条
watch(
  () => chat.current?.id,
  id => {
    if (id && route.query.c !== id) void router.replace({ query: { c: id } })
  }
)

onMounted(async () => {
  await Promise.all([chat.loadConversations(), chat.loadCharacters(), kb.load()])
  const preset = typeof route.query.c === 'string' ? route.query.c : null
  const target = preset && chat.conversations.some(c => c.id === preset) ? preset : chat.conversations[0]?.id
  if (target) await chat.selectConversation(target)
})
</script>

<template>
  <div class="flex h-screen">
    <Sidebar />
    <div class="flex flex-1 flex-col">
      <header class="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <span class="text-sm font-medium">{{ chat.current?.title ?? '请选择或新建对话' }}</span>
        <div class="flex items-center gap-3">
          <span class="text-sm text-gray-500">{{ auth.user?.username }}</span>
          <button class="text-sm text-gray-500 hover:text-red-500" @click="onLogout">登出</button>
        </div>
      </header>

      <div ref="scrollRef" class="flex-1 space-y-4 overflow-y-auto p-4">
        <p v-if="!chat.current" class="mt-10 text-center text-sm text-gray-400">点击左侧「新建对话」开始聊天</p>
        <MessageBubble v-for="m in chat.messages" :key="m.id" :message="m" />
      </div>

      <ChatInput v-if="chat.current" :disabled="chat.sending" @send="onSend" />
    </div>
  </div>
</template>
