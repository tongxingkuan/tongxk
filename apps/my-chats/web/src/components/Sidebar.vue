<script setup lang="ts">
import { useChatStore } from '../stores/chat'

const chat = useChatStore()

async function onNew() {
  await chat.newConversation()
}

async function onSelect(id: string) {
  await chat.selectConversation(id)
}

async function onRemove(id: string, title: string) {
  if (confirm(`删除对话「${title}」？`)) await chat.removeConversation(id)
}
</script>

<template>
  <aside class="flex w-64 flex-col border-r border-gray-200 bg-gray-50">
    <div class="p-3">
      <button class="w-full rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700" @click="onNew">
        + 新建对话
      </button>
    </div>
    <nav class="flex-1 overflow-y-auto px-2 pb-2">
      <button
        v-for="c in chat.conversations"
        :key="c.id"
        :class="[
          'group mb-1 flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm',
          chat.current?.id === c.id ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-200',
        ]"
        @click="onSelect(c.id)"
      >
        <span class="flex-1 truncate">{{ c.title }}</span>
        <span
          class="ml-2 hidden text-gray-400 hover:text-red-500 group-hover:inline"
          @click.stop="onRemove(c.id, c.title)"
        >
          ×
        </span>
      </button>
    </nav>
    <div class="border-t border-gray-200 p-3">
      <router-link
        to="/knowledge"
        class="block w-full rounded-lg border border-gray-300 px-3 py-2 text-center text-sm hover:bg-gray-100"
      >
        知识库管理
      </router-link>
    </div>
  </aside>
</template>
