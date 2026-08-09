<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useKnowledgeStore } from '../stores/knowledge'

const router = useRouter()
const kb = useKnowledgeStore()
const newName = ref('')
const creating = ref(false)
const uploadingId = ref<string | null>(null)

async function onCreate() {
  if (!newName.value.trim() || creating.value) return
  creating.value = true
  try {
    await kb.createBase(newName.value.trim())
    newName.value = ''
  } finally {
    creating.value = false
  }
}

async function onRemove(id: string, name: string) {
  if (confirm(`删除知识库「${name}」及其全部文档？`)) await kb.removeBase(id)
}

function onUpload(id: string, e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  uploadingId.value = id
  kb.uploadDocument(id, file)
    .then(res => alert(`上传成功：${res.filename}（切片 ${res.chunks} 个）`))
    .catch(err => alert(err instanceof Error ? err.message : '上传失败'))
    .finally(() => {
      uploadingId.value = null
      input.value = ''
    })
}

onMounted(() => kb.load())
</script>

<template>
  <div class="flex h-screen flex-col">
    <header class="flex items-center justify-between border-b border-gray-200 px-4 py-3">
      <button class="text-sm text-gray-500 hover:text-gray-800" @click="router.push({ name: 'chat' })">
        ← 返回聊天
      </button>
      <h1 class="text-sm font-medium">知识库管理</h1>
      <span class="w-16" />
    </header>

    <div class="border-b border-gray-200 bg-gray-50 p-4">
      <div class="flex gap-2">
        <input
          v-model="newName"
          placeholder="新知识库名称"
          class="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
          @keydown.enter="onCreate"
        />
        <button
          class="rounded-xl bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50"
          :disabled="creating || !newName.trim()"
          @click="onCreate"
        >
          创建
        </button>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto p-4">
      <p v-if="kb.loaded && !kb.bases.length" class="mt-10 text-center text-sm text-gray-400">
        还没有知识库，先创建一个并上传文档
      </p>
      <ul class="space-y-2">
        <li
          v-for="b in kb.bases"
          :key="b.id"
          class="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3"
        >
          <div>
            <p class="text-sm font-medium">{{ b.name }}</p>
            <p class="text-xs text-gray-400">{{ new Date(b.createdAt).toLocaleString() }}</p>
          </div>
          <div class="flex items-center gap-2">
            <label
              class="cursor-pointer rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100"
              :class="{ 'opacity-50': uploadingId === b.id }"
            >
              {{ uploadingId === b.id ? '上传中...' : '上传文档' }}
              <input type="file" accept=".md,.txt" class="hidden" @change="onUpload(b.id, $event)" />
            </label>
            <button class="text-sm text-gray-400 hover:text-red-500" @click="onRemove(b.id, b.name)">删除</button>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>
