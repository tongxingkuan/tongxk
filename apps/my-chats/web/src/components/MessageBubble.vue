<script setup lang="ts">
import { computed } from 'vue'
import type { Message } from '../api/types'
import { renderMarkdown } from '../utils/markdown'

const props = defineProps<{ message: Message }>()
const html = computed(() => renderMarkdown(props.message.content))
</script>

<template>
  <div :class="['flex', message.role === 'user' ? 'justify-end' : 'justify-start']">
    <div
      :class="[
        'max-w-[80%] break-words rounded-2xl px-4 py-2 text-sm leading-relaxed',
        message.role === 'user' ? 'whitespace-pre-wrap bg-blue-600 text-white' : 'bg-gray-100 text-gray-900',
      ]"
    >
      <template v-if="message.role === 'assistant'">
        <div class="md" v-html="html"></div>
        <span v-if="message.status === 'generating'" class="animate-pulse">▌</span>
      </template>
      <template v-else>{{ message.content }}</template>
    </div>
  </div>
</template>
