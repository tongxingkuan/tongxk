<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()

const mode = ref<'login' | 'register'>('login')
const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function submit() {
  error.value = ''
  loading.value = true
  try {
    if (mode.value === 'login') await auth.login(username.value, password.value)
    else await auth.register(username.value, password.value)
    router.push({ name: 'chat' })
  } catch (e) {
    const msg = (e as { response?: { data?: { message?: string } } }).response?.data?.message
    error.value = msg ?? '请求失败'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-100">
    <div class="w-80 rounded-2xl bg-white p-6 shadow">
      <h1 class="mb-4 text-center text-xl font-semibold">
        {{ mode === 'login' ? '登录' : '注册' }}
      </h1>
      <form class="space-y-3" @submit.prevent="submit">
        <input
          v-model="username"
          placeholder="用户名（≥3 字符）"
          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
        />
        <input
          v-model="password"
          type="password"
          placeholder="密码（≥6 字符）"
          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
        />
        <p v-if="error" class="text-sm text-red-500">{{ error }}</p>
        <button
          :disabled="loading"
          class="w-full rounded-lg bg-blue-600 px-3 py-2 text-sm text-white disabled:opacity-50"
        >
          {{ loading ? '处理中...' : mode === 'login' ? '登录' : '注册' }}
        </button>
      </form>
      <p class="mt-4 text-center text-sm text-gray-500">
        <button @click="mode = mode === 'login' ? 'register' : 'login'">
          {{ mode === 'login' ? '没有账号？去注册' : '已有账号？去登录' }}
        </button>
      </p>
    </div>
  </div>
</template>
