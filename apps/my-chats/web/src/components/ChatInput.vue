<script setup lang="ts">
import { ref } from 'vue'
import { useChatStore } from '../stores/chat'
import { useKnowledgeStore } from '../stores/knowledge'

const props = defineProps<{ disabled?: boolean }>()
const emit = defineEmits<{ send: [content: string] }>()

const chat = useChatStore()
const kb = useKnowledgeStore()
const text = ref('')

async function onToggleRag(e: Event) {
  const enabled = (e.target as HTMLInputElement).checked
  try {
    await kb.toggleRag(enabled)
  } catch {
    kb.ragEnabled = !enabled
  }
}

function submit() {
  const content = text.value.trim()
  if (!content || props.disabled) return
  emit('send', content)
  text.value = ''
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    submit()
  }
}
</script>

<template>
  <div class="border-t border-gray-200 p-4">
    <div class="mb-2 flex items-center gap-4">
      <label class="flex items-center gap-1 text-xs text-gray-500">
        <span>角色</span>
        <select
          v-model="chat.currentCharacter"
          :disabled="disabled"
          class="rounded-lg border border-gray-300 px-2 py-1 text-sm outline-none focus:border-blue-500 disabled:bg-gray-50"
        >
          <option v-for="c in chat.characters" :key="c.key" :value="c.key">{{ c.name }}</option>
        </select>
      </label>
      <label class="flex cursor-pointer items-center gap-1 text-xs text-gray-500">
        <span>知识库检索</span>
        <input type="checkbox" :checked="kb.ragEnabled" @change="onToggleRag" />
      </label>
    </div>
    <div class="flex items-end gap-2">
      <textarea
        v-model="text"
        :disabled="disabled"
        rows="1"
        placeholder="输入消息，Enter 发送，Shift+Enter 换行"
        class="flex-1 resize-none rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 disabled:bg-gray-50"
        @keydown="onKeydown"
      />
      <button
        :disabled="disabled || !text.trim()"
        class="rounded-xl bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50"
        @click="submit"
      >
        发送
      </button>
    </div>
  </div>
</template>
