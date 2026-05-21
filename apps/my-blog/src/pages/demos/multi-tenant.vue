<template>
  <Title>多租户管理系统</Title>
  <NuxtLink to="/articles" class="back-link">← 返回</NuxtLink>
  <div class="mt-wrapper">
    <!-- 顶部：API 地址 + 当前租户上下文 -->
    <div class="top-bar">
      <div class="bar-item">
        <label>API Base URL</label>
        <input v-model="apiBase" placeholder="http://localhost:3001" />
      </div>
      <div class="bar-item">
        <label>当前租户上下文 (x-tenant-id)</label>
        <select v-model="activeTenantId" :disabled="!tenants.length">
          <option v-for="t in tenants" :key="t.id" :value="t.id">{{ t.name }} · {{ t.plan }}</option>
          <option v-if="!tenants.length" :value="''">— 暂无租户 —</option>
        </select>
      </div>
      <button class="primary" @click="loadAll">刷新</button>
    </div>

    <div class="status-bar">
      <span class="status-tag" :class="{ ok: serverOk, err: !serverOk }">
        {{ serverOk ? '服务已连接' : '服务未连接' }}
      </span>
      <span v-if="errorMsg" class="status-msg">{{ errorMsg }}</span>
      <span class="status-spacer" />
      <template v-if="currentUser">
        <span class="user-tag" :class="{ admin: isSuperAdmin }">
          {{ isSuperAdmin ? '⭐ 超级管理员' : '👤 普通用户' }} · {{ currentUser.username }}
        </span>
        <button class="ghost" @click="logout">退出登录</button>
      </template>
      <template v-else>
        <button class="ghost" @click="openAuth('login')">登录</button>
        <button class="ghost" @click="openAuth('register')">注册</button>
      </template>
    </div>

    <!-- 登录/注册弹窗 -->
    <div v-if="authVisible" class="auth-mask" @click.self="authVisible = false">
      <div class="auth-card">
        <header class="auth-header">
          <button class="tab" :class="{ active: authMode === 'login' }" @click="authMode = 'login'">登录</button>
          <button class="tab" :class="{ active: authMode === 'register' }" @click="authMode = 'register'">注册</button>
          <button class="close" @click="authVisible = false">×</button>
        </header>
        <form class="auth-form" @submit.prevent="submitAuth">
          <label>
            <span>用户名</span>
            <input v-model="authForm.username" autocomplete="username" required minlength="3" />
          </label>
          <label>
            <span>密码</span>
            <input v-model="authForm.password" type="password" autocomplete="current-password" required minlength="6" />
          </label>
          <div v-if="authError" class="auth-error">{{ authError }}</div>
          <button type="submit" class="primary" :disabled="authLoading">
            {{ authLoading ? '处理中…' : authMode === 'login' ? '登录' : '注册并登录' }}
          </button>
        </form>
      </div>
    </div>

    <div class="panel-grid">
      <!-- 左：租户管理 -->
      <section class="panel">
        <header class="panel-header">
          <h3>🏢 租户列表（{{ tenants.length }}）</h3>
        </header>
        <div class="panel-body">
          <form class="form-row" @submit.prevent="createTenant">
            <input v-model="tenantForm.name" placeholder="租户名称（如 acme-corp）" required />
            <select v-model="tenantForm.plan">
              <option value="free">free</option>
              <option value="pro">pro</option>
              <option value="enterprise">enterprise</option>
            </select>
            <button type="submit" class="primary">新建</button>
          </form>
          <ul v-if="tenants.length" class="entity-list">
            <li
              v-for="t in tenants"
              :key="t.id"
              class="entity-item"
              :class="{ active: t.id === activeTenantId }"
              @click="activeTenantId = t.id"
            >
              <div class="entity-main">
                <div class="entity-name">{{ t.name }}</div>
                <div class="entity-sub">
                  <span class="badge" :class="`plan-${t.plan}`">{{ t.plan }}</span>
                  <span class="entity-meta">{{ formatDate(t.createdAt) }}</span>
                </div>
              </div>
              <button class="danger" @click.stop="removeTenant(t)">删除</button>
            </li>
          </ul>
          <div v-else class="empty">尚未创建租户，先建一个吧</div>
        </div>
      </section>

      <!-- 右：当前租户的成员 -->
      <section class="panel">
        <header class="panel-header">
          <h3>👥 成员列表（{{ members.length }}）</h3>
          <span v-if="activeTenant" class="header-sub">@ {{ activeTenant.name }}</span>
        </header>
        <div class="panel-body">
          <form class="form-row form-row-wide" @submit.prevent="createMember">
            <input v-model="memberForm.name" placeholder="姓名" required />
            <input v-model="memberForm.email" placeholder="邮箱" type="email" required />
            <select v-model="memberForm.role">
              <option value="owner">owner</option>
              <option value="admin">admin</option>
              <option value="member">member</option>
            </select>
            <button type="submit" class="primary" :disabled="!activeTenantId">添加</button>
          </form>
          <ul v-if="members.length" class="entity-list">
            <li v-for="m in members" :key="m.id" class="entity-item">
              <div class="entity-main">
                <div class="entity-name">
                  {{ m.name }} <span class="email">{{ m.email }}</span>
                </div>
                <div class="entity-sub">
                  <span class="badge" :class="`role-${m.role}`">{{ m.role }}</span>
                  <span class="entity-meta">{{ formatDate(m.createdAt) }}</span>
                </div>
              </div>
              <button class="danger" @click="removeMember(m)">移除</button>
            </li>
          </ul>
          <div v-else class="empty">
            {{ activeTenantId ? '当前租户暂无成员，可以添加一位试试' : '请先在左侧选择或创建一个租户' }}
          </div>
        </div>
      </section>
    </div>

    <!-- 服务端监控（来自 my-nestjs /health + /metrics） -->
    <section class="log-panel monitor-panel">
      <header class="panel-header">
        <h3>📊 服务端监控</h3>
        <div class="header-tools">
          <label class="poll-toggle"> <input type="checkbox" v-model="autoPoll" /> 自动轮询(5s) </label>
          <button class="ghost" @click="loadMonitor">刷新</button>
          <button class="ghost" @click="resetMetrics">重置指标</button>
        </div>
      </header>
      <div v-if="health || metrics" class="monitor-body">
        <div class="metric-cards">
          <div class="metric-card">
            <div class="metric-label">健康状态</div>
            <div class="metric-value" :class="health?.status === 'ok' ? 'ok' : 'err'">
              {{ health?.status ?? '—' }}
            </div>
            <div class="metric-sub">DB: {{ health?.checks?.db ?? '—' }}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">运行时长</div>
            <div class="metric-value">{{ formatUptime(health?.uptimeSec ?? metrics?.uptimeSec) }}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">请求总数</div>
            <div class="metric-value">{{ metrics?.totalRequests ?? 0 }}</div>
            <div class="metric-sub">
              错误 {{ metrics?.totalErrors ?? 0 }} ({{ ((metrics?.errorRate ?? 0) * 100).toFixed(1) }}%)
            </div>
          </div>
          <div class="metric-card">
            <div class="metric-label">堆内存</div>
            <div class="metric-value">{{ metrics?.memory.heapUsedMB ?? 0 }} MB</div>
            <div class="metric-sub">RSS {{ metrics?.memory.rssMB ?? 0 }} MB</div>
          </div>
        </div>

        <div class="route-table" v-if="metrics?.routes?.length">
          <div class="route-row route-head">
            <span>METHOD</span>
            <span>PATH</span>
            <span>COUNT</span>
            <span>ERR</span>
            <span>AVG</span>
            <span>P95</span>
            <span>P99</span>
            <span>MAX</span>
          </div>
          <div v-for="r in metrics.routes" :key="r.method + r.path" class="route-row">
            <span class="method">{{ r.method }}</span>
            <span class="path">{{ r.path }}</span>
            <span>{{ r.count }}</span>
            <span :class="{ err: r.errors > 0 }">{{ r.errors }}</span>
            <span>{{ r.avgMs }}ms</span>
            <span>{{ r.p95 }}ms</span>
            <span>{{ r.p99 }}ms</span>
            <span>{{ r.maxMs }}ms</span>
          </div>
        </div>
      </div>
      <div v-else class="empty">暂无监控数据，请先启动 my-nestjs（端口 3100）</div>
    </section>

    <!-- 数据库管理（仅超级管理员可见） -->
    <section v-if="isSuperAdmin" class="log-panel db-panel">
      <header class="panel-header">
        <h3>🗄️ 数据库管理（superadmin）</h3>
        <div class="header-tools">
          <button class="ghost" @click="loadDbInfo">刷新</button>
        </div>
      </header>
      <div class="db-body">
        <div class="metric-cards">
          <div class="metric-card">
            <div class="metric-label">数据库类型</div>
            <div class="metric-value">{{ dbInfo?.dbType ?? '—' }}</div>
            <div class="metric-sub">{{ dbInfo?.database ?? '' }}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">租户数</div>
            <div class="metric-value">{{ dbInfo?.counts?.tenants ?? 0 }}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">成员数</div>
            <div class="metric-value">{{ dbInfo?.counts?.members ?? 0 }}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">连接状态</div>
            <div class="metric-value" :class="dbInfo?.isInitialized ? 'ok' : 'err'">
              {{ dbInfo?.isInitialized ? 'connected' : '—' }}
            </div>
          </div>
        </div>
        <div class="db-actions">
          <button class="primary" @click="seedDb">灌入示例数据</button>
          <button class="danger-bg" @click="clearDb('tenants')">清空租户</button>
          <button class="danger-bg" @click="clearDb('members')">清空成员</button>
          <button class="danger-bg" @click="clearDb('all')">清空全部</button>
          <button class="ghost-strong" @click="exportDb">导出 JSON</button>
          <label class="ghost-strong file-btn">
            导入 JSON
            <input type="file" accept="application/json" @change="onImportFile" hidden />
          </label>
        </div>
        <div v-if="dbActionMsg" class="db-msg" :class="dbActionOk ? 'ok' : 'err'">
          {{ dbActionMsg }}
        </div>
      </div>
    </section>

    <!-- 底部：API 调用日志 -->
    <section class="log-panel">
      <header class="panel-header">
        <h3>🔍 接口调用日志</h3>
        <button class="ghost" @click="logs = []">清空</button>
      </header>
      <ul class="log-list">
        <li v-for="(log, i) in logs" :key="i" :class="['log-item', log.ok ? 'ok' : 'err']">
          <span class="method">{{ log.method }}</span>
          <span class="url">{{ log.url }}</span>
          <span v-if="log.tenant" class="tenant">x-tenant-id: {{ log.tenant }}</span>
          <span class="status">{{ log.status }}</span>
        </li>
        <li v-if="!logs.length" class="log-empty">暂无请求</li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'demo',
  pageTransition: { name: 'demos' },
})

interface Tenant {
  id: string
  name: string
  plan: string
  active: boolean
  createdAt: string
}
interface Member {
  id: string
  tenantId: string
  name: string
  email: string
  role: string
  createdAt: string
}
interface LogEntry {
  method: string
  url: string
  tenant?: string
  status: string
  ok: boolean
}

interface ApiError extends Error {
  status?: number
  /** 4xx 业务错误（前端可提示用户修正），区别于网络/5xx（服务异常） */
  isBusiness?: boolean
}

interface HealthInfo {
  status: string
  uptimeSec: number
  checks: { db: string }
}

interface RouteMetric {
  method: string
  path: string
  count: number
  errors: number
  avgMs: number
  maxMs: number
  p50: number
  p95: number
  p99: number
}

interface MetricsInfo {
  uptimeSec: number
  totalRequests: number
  totalErrors: number
  errorRate: number
  memory: { rssMB: number; heapUsedMB: number; heapTotalMB: number }
  routes: RouteMetric[]
}

interface DbInfo {
  dbType: string
  database: string
  isInitialized: boolean
  counts: { tenants: number; members: number }
}

interface CurrentUser {
  id: string
  username: string
  role: string
  createdAt: string
}

const DEFAULT_API_BASE = import.meta.env.DEV ? 'http://localhost:3100' : 'https://tongxingkuan.xin:3100'

const apiBase = ref(DEFAULT_API_BASE)
const tenants = ref<Tenant[]>([])
const members = ref<Member[]>([])
const activeTenantId = ref('')
const serverOk = ref(false)
const errorMsg = ref('')
const logs = ref<LogEntry[]>([])
const health = ref<HealthInfo | null>(null)
const metrics = ref<MetricsInfo | null>(null)
const autoPoll = ref(false)
let pollTimer: ReturnType<typeof setInterval> | null = null

const dbInfo = ref<DbInfo | null>(null)
const dbActionMsg = ref('')
const dbActionOk = ref(true)

const TOKEN_KEY = 'mt-auth-token'
const authToken = ref<string>('')
const currentUser = ref<CurrentUser | null>(null)
const isSuperAdmin = computed(() => currentUser.value?.role === 'superadmin')

const authVisible = ref(false)
const authMode = ref<'login' | 'register'>('login')
const authForm = reactive({ username: '', password: '' })
const authError = ref('')
const authLoading = ref(false)

const openAuth = (mode: 'login' | 'register') => {
  authMode.value = mode
  authForm.username = ''
  authForm.password = ''
  authError.value = ''
  authVisible.value = true
}

const formatUptime = (sec?: number) => {
  if (!sec && sec !== 0) return '—'
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  return `${h}h ${m}m ${s}s`
}

const tenantForm = reactive({ name: '', plan: 'free' })
const memberForm = reactive({ name: '', email: '', role: 'member' })

const activeTenant = computed(() => tenants.value.find(t => t.id === activeTenantId.value))

const formatDate = (s: string) => {
  if (!s) return ''
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? s : d.toLocaleString()
}

/** 把 HTTP 状态码翻译成更友好的中文提示。 */
const friendlyError = (status: number, path: string, method: string, serverMsg?: string): string => {
  if (status === 409) {
    if (path.startsWith('/tenants') && method === 'POST') return '租户名已存在，请换一个名称'
    return '资源冲突：' + (serverMsg ?? '同名记录已存在')
  }
  if (status === 400) return serverMsg || '参数有误，请检查表单输入'
  if (status === 401) return '未授权，请检查登录状态'
  if (status === 403) return '没有权限访问该资源'
  if (status === 404) {
    if (path.startsWith('/tenants/') && method === 'GET') return '租户不存在或已被删除'
    if (path.startsWith('/members/')) return '成员不存在于当前租户'
    return serverMsg || '资源不存在'
  }
  if (status === 500) return '服务端内部错误：' + (serverMsg ?? '请查看 my-nestjs 日志')
  if (status >= 500) return `服务端异常 (HTTP ${status})`
  return serverMsg || `HTTP ${status}`
}

const request = async <T,>(
  path: string,
  options: { method?: string; body?: unknown; tenant?: string; auth?: boolean } = {}
): Promise<T> => {
  const method = options.method ?? 'GET'
  const url = `${apiBase.value.replace(/\/$/, '')}${path}`
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (options.tenant) headers['x-tenant-id'] = options.tenant
  // 默认带上 token（如果有），便于服务端在需要时识别用户
  if (authToken.value) headers['authorization'] = `Bearer ${authToken.value}`
  let status = '?'
  let ok = false
  try {
    const res = await fetch(url, {
      method,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    })
    status = String(res.status)
    ok = res.ok
    const text = await res.text()
    const data = text ? JSON.parse(text) : null
    if (!res.ok) {
      const err: ApiError = new Error(friendlyError(res.status, path, method, data?.message))
      err.status = res.status
      // 4xx 是业务错误，不应判定服务挂掉
      err.isBusiness = res.status >= 400 && res.status < 500
      throw err
    }
    return data as T
  } catch (e: unknown) {
    ok = false
    if (status === '?') status = 'ERR'
    throw e
  } finally {
    logs.value.unshift({ method, url, tenant: options.tenant, status, ok })
    if (logs.value.length > 30) logs.value.length = 30
  }
}

const safeRun = async (fn: () => Promise<void>) => {
  errorMsg.value = ''
  try {
    await fn()
    serverOk.value = true
  } catch (e: unknown) {
    const err = e as ApiError
    // 仅当不是业务错误（4xx）时才认为服务异常
    if (!err.isBusiness) serverOk.value = false
    errorMsg.value = e instanceof Error ? e.message : String(e)
  }
}

const loadTenants = async () => {
  tenants.value = await request<Tenant[]>('/tenants')
  if (!activeTenantId.value && tenants.value.length) {
    activeTenantId.value = tenants.value[0].id
  }
  if (activeTenantId.value && !tenants.value.find(t => t.id === activeTenantId.value)) {
    activeTenantId.value = tenants.value[0]?.id ?? ''
  }
}

const loadMembers = async () => {
  if (!activeTenantId.value) {
    members.value = []
    return
  }
  members.value = await request<Member[]>('/members', { tenant: activeTenantId.value })
}

const loadAll = () =>
  safeRun(async () => {
    await loadTenants()
    await loadMembers()
  })

const createTenant = () =>
  safeRun(async () => {
    if (!tenantForm.name.trim()) return
    const created = await request<Tenant>('/tenants', {
      method: 'POST',
      body: { name: tenantForm.name.trim(), plan: tenantForm.plan },
    })
    tenantForm.name = ''
    await loadTenants()
    activeTenantId.value = created.id
    await loadMembers()
  })

const removeTenant = (t: Tenant) =>
  safeRun(async () => {
    if (!confirm(`确定删除租户 "${t.name}" 及其全部成员？`)) return
    await request(`/tenants/${t.id}`, { method: 'DELETE' })
    await loadTenants()
    await loadMembers()
  })

const createMember = () =>
  safeRun(async () => {
    if (!activeTenantId.value) return
    if (!memberForm.name.trim() || !memberForm.email.trim()) return
    await request<Member>('/members', {
      method: 'POST',
      body: { name: memberForm.name.trim(), email: memberForm.email.trim(), role: memberForm.role },
      tenant: activeTenantId.value,
    })
    memberForm.name = ''
    memberForm.email = ''
    await loadMembers()
  })

const removeMember = (m: Member) =>
  safeRun(async () => {
    await request(`/members/${m.id}`, { method: 'DELETE', tenant: activeTenantId.value })
    await loadMembers()
  })

const loadMonitor = async () => {
  // 监控接口失败不影响主流程，单独捕获
  try {
    const [h, m] = await Promise.all([request<HealthInfo>('/health'), request<MetricsInfo>('/metrics')])
    health.value = h
    metrics.value = m
  } catch {
    // 静默：服务未启动时不刷错
  }
}

const resetMetrics = () =>
  safeRun(async () => {
    await request('/metrics', { method: 'DELETE' })
    await loadMonitor()
  })

const setDbMsg = (msg: string, ok = true) => {
  dbActionMsg.value = msg
  dbActionOk.value = ok
}

const loadDbInfo = async () => {
  try {
    dbInfo.value = await request<DbInfo>('/db/info')
  } catch (e) {
    setDbMsg(e instanceof Error ? e.message : String(e), false)
  }
}

const seedDb = () =>
  safeRun(async () => {
    const r = await request<{ createdTenants: number; createdMembers: number }>('/db/seed', {
      method: 'POST',
    })
    setDbMsg(`已灌入 ${r.createdTenants} 个租户、${r.createdMembers} 个成员`, true)
    await Promise.all([loadDbInfo(), loadAll()])
  })

const clearDb = (scope: 'all' | 'tenants' | 'members') =>
  safeRun(async () => {
    const label = scope === 'all' ? '全部数据' : scope === 'tenants' ? '租户' : '成员'
    if (!confirm(`确定清空${label}？该操作不可恢复`)) return
    const r = await request<{ deleted: Record<string, number> }>(`/db/data?scope=${scope}`, {
      method: 'DELETE',
    })
    const summary = Object.entries(r.deleted)
      .map(([k, v]) => `${k}: ${v}`)
      .join('，')
    setDbMsg(`已清空 ${label}（${summary}）`, true)
    await Promise.all([loadDbInfo(), loadAll()])
  })

const exportDb = () =>
  safeRun(async () => {
    const data = await request<unknown>('/db/export')
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `my-nestjs-db-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`
    a.click()
    URL.revokeObjectURL(a.href)
    setDbMsg('已导出 JSON 文件', true)
  })

const onImportFile = (e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (!confirm(`导入将先清空当前数据，再写入 ${file.name}，是否继续？`)) {
    input.value = ''
    return
  }
  safeRun(async () => {
    const text = await file.text()
    const payload = JSON.parse(text)
    const r = await request<{ imported: { tenants: number; members: number } }>('/db/import', {
      method: 'POST',
      body: payload,
    })
    setDbMsg(`已导入 ${r.imported.tenants} 个租户、${r.imported.members} 个成员`, true)
    await Promise.all([loadDbInfo(), loadAll()])
  }).finally(() => {
    input.value = ''
  })
}

watch(autoPoll, on => {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
  if (on) {
    loadMonitor()
    pollTimer = setInterval(loadMonitor, 5000)
  }
})

watch(activeTenantId, () => {
  if (activeTenantId.value) safeRun(loadMembers)
})

const persistToken = (token: string) => {
  authToken.value = token
  if (typeof window !== 'undefined') {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  }
}

const submitAuth = async () => {
  authError.value = ''
  authLoading.value = true
  try {
    const path = authMode.value === 'login' ? '/auth/login' : '/auth/register'
    const res = await request<{ token: string; user: CurrentUser }>(path, {
      method: 'POST',
      body: { username: authForm.username.trim(), password: authForm.password },
    })
    persistToken(res.token)
    currentUser.value = res.user
    authVisible.value = false
    // 登录后刷新一次数据库信息（仅 superadmin 才有 db 面板可见）
    if (isSuperAdmin.value) loadDbInfo()
  } catch (e) {
    authError.value = e instanceof Error ? e.message : String(e)
  } finally {
    authLoading.value = false
  }
}

const logout = () => {
  persistToken('')
  currentUser.value = null
  dbInfo.value = null
}

const restoreSession = async () => {
  if (typeof window === 'undefined') return
  const saved = localStorage.getItem(TOKEN_KEY)
  if (!saved) return
  authToken.value = saved
  try {
    currentUser.value = await request<CurrentUser>('/auth/me')
  } catch {
    // token 失效，清掉
    persistToken('')
    currentUser.value = null
  }
}

onMounted(async () => {
  await restoreSession()
  await loadAll()
  loadMonitor()
  if (isSuperAdmin.value) loadDbInfo()
})

onBeforeUnmount(() => {
  if (pollTimer) clearInterval(pollTimer)
})
</script>

<style lang="less" scoped>
.back-link {
  display: inline-block;
  margin: 16px 0 0 24px;
  color: #e6a23c;
  text-decoration: none;
  font-size: 14px;
  &:hover {
    text-decoration: underline;
  }
}

.mt-wrapper {
  padding: 16px 24px 32px;
  max-width: 1280px;
  margin: 0 auto;
  font-size: 14px;
  color: #303133;
}

.top-bar {
  display: flex;
  gap: 16px;
  align-items: flex-end;
  flex-wrap: wrap;
  background: #fff;
  border-radius: 12px;
  padding: 16px 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  margin-bottom: 12px;

  .bar-item {
    flex: 1;
    min-width: 220px;
    display: flex;
    flex-direction: column;
    gap: 6px;

    label {
      font-size: 12px;
      color: #888;
      font-weight: 500;
    }

    input,
    select {
      height: 34px;
      border: 1px solid #dcdfe6;
      border-radius: 6px;
      padding: 0 10px;
      font-size: 13px;
      background: #fff;
      outline: none;
      transition: border-color 0.2s;
      &:focus {
        border-color: #e6a23c;
      }
    }
  }
}

.status-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  font-size: 12px;

  .status-tag {
    display: inline-flex;
    align-items: center;
    padding: 2px 10px;
    border-radius: 10px;
    font-weight: 500;

    &.ok {
      background: #f0f9eb;
      color: #67c23a;
    }
    &.err {
      background: #fef0f0;
      color: #f56c6c;
    }

    &::before {
      content: '';
      display: inline-block;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      margin-right: 6px;
      background: currentColor;
    }
  }

  .status-msg {
    color: #f56c6c;
  }
}

.panel-grid {
  display: grid;
  grid-template-columns: 1fr 1.4fr;
  gap: 16px;
  margin-bottom: 16px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
}

.panel,
.log-panel {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid #f0f0f0;
  background: linear-gradient(135deg, rgba(230, 162, 60, 0.06), rgba(245, 108, 108, 0.06));

  h3 {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
  }

  .header-sub {
    font-size: 12px;
    color: #888;
  }
}

.panel-body {
  padding: 14px 18px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 110px auto;
  gap: 8px;
  margin-bottom: 14px;

  &.form-row-wide {
    grid-template-columns: 1fr 1fr 110px auto;
  }

  input,
  select {
    height: 34px;
    border: 1px solid #dcdfe6;
    border-radius: 6px;
    padding: 0 10px;
    font-size: 13px;
    outline: none;
    background: #fff;
    &:focus {
      border-color: #e6a23c;
    }
  }
}

button {
  height: 34px;
  padding: 0 16px;
  border-radius: 6px;
  border: 1px solid transparent;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  background: #f4f4f5;
  color: #606266;

  &:hover:not(:disabled) {
    filter: brightness(0.95);
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &.primary {
    background: linear-gradient(135deg, #e6a23c, #f56c6c);
    color: #fff;
    border-color: transparent;
  }
  &.danger {
    background: transparent;
    color: #f56c6c;
    border-color: #fbc4c4;
    height: 28px;
    padding: 0 10px;
    font-size: 12px;
    &:hover:not(:disabled) {
      background: #fef0f0;
    }
  }
  &.ghost {
    background: transparent;
    color: #909399;
    height: 28px;
    padding: 0 10px;
    font-size: 12px;
  }
}

.entity-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.entity-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  transition: all 0.2s;
  cursor: pointer;

  &:hover {
    border-color: #e6a23c;
    background: rgba(230, 162, 60, 0.04);
  }

  &.active {
    border-color: #e6a23c;
    background: rgba(230, 162, 60, 0.08);
    box-shadow: 0 0 0 2px rgba(230, 162, 60, 0.15);
  }

  .entity-main {
    flex: 1;
    min-width: 0;
  }
  .entity-name {
    font-weight: 500;
    color: #303133;
    .email {
      font-weight: 400;
      color: #909399;
      font-size: 12px;
      margin-left: 6px;
    }
  }
  .entity-sub {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-top: 4px;
    font-size: 12px;
    color: #909399;
  }
  .entity-meta {
    font-size: 12px;
  }
}

.badge {
  display: inline-block;
  padding: 1px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
  background: #f4f4f5;
  color: #606266;

  &.plan-free {
    background: #f4f4f5;
    color: #606266;
  }
  &.plan-pro {
    background: #ecf5ff;
    color: #409eff;
  }
  &.plan-enterprise {
    background: #fdf6ec;
    color: #e6a23c;
  }

  &.role-owner {
    background: #fef0f0;
    color: #f56c6c;
  }
  &.role-admin {
    background: #fdf6ec;
    color: #e6a23c;
  }
  &.role-member {
    background: #f0f9eb;
    color: #67c23a;
  }
}

.empty {
  padding: 28px 12px;
  text-align: center;
  color: #c0c4cc;
  font-size: 13px;
}

.log-panel {
  margin-top: 16px;
}

.log-list {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 220px;
  overflow-y: auto;
  font-family: 'SFMono-Regular', Menlo, monospace;
  font-size: 12px;
}

.log-item {
  display: grid;
  grid-template-columns: 60px 1fr auto auto;
  gap: 12px;
  align-items: center;
  padding: 8px 18px;
  border-bottom: 1px solid #f6f6f6;

  .method {
    font-weight: 600;
    color: #606266;
  }
  .url {
    color: #303133;
    word-break: break-all;
  }
  .tenant {
    color: #909399;
    font-size: 11px;
  }
  .status {
    padding: 1px 8px;
    border-radius: 8px;
    font-size: 11px;
    font-weight: 600;
  }
  &.ok .status {
    background: #f0f9eb;
    color: #67c23a;
  }
  &.err .status {
    background: #fef0f0;
    color: #f56c6c;
  }
}

.log-empty {
  padding: 28px;
  text-align: center;
  color: #c0c4cc;
}

.monitor-panel {
  margin-top: 0;
  margin-bottom: 16px;

  .header-tools {
    display: flex;
    align-items: center;
    gap: 12px;

    .poll-toggle {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #606266;
      cursor: pointer;
    }
  }
}

.monitor-body {
  padding: 14px 18px 4px;
}

.metric-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 14px;
}

.metric-card {
  padding: 10px 14px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: linear-gradient(135deg, rgba(230, 162, 60, 0.04), rgba(245, 108, 108, 0.04));

  .metric-label {
    font-size: 12px;
    color: #909399;
  }

  .metric-value {
    font-size: 22px;
    font-weight: 600;
    margin-top: 4px;
    color: #303133;

    &.ok {
      color: #67c23a;
    }
    &.err {
      color: #f56c6c;
    }
  }

  .metric-sub {
    margin-top: 4px;
    font-size: 11px;
    color: #909399;
  }
}

.route-table {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  overflow: hidden;
  font-family: 'SFMono-Regular', Menlo, monospace;
  font-size: 12px;
  margin-bottom: 14px;
}

.route-row {
  display: grid;
  grid-template-columns: 60px 2fr repeat(6, 1fr);
  gap: 8px;
  padding: 6px 12px;
  border-bottom: 1px solid #f6f6f6;

  &.route-head {
    background: #fafafa;
    font-weight: 600;
    color: #909399;
    font-size: 11px;
  }

  &:last-child {
    border-bottom: none;
  }

  .method {
    color: #606266;
    font-weight: 600;
  }
  .path {
    color: #303133;
    word-break: break-all;
  }
  .err {
    color: #f56c6c;
    font-weight: 600;
  }
}

.db-panel {
  margin-top: 0;
  margin-bottom: 16px;

  .token-input {
    height: 28px;
    border: 1px solid #dcdfe6;
    border-radius: 6px;
    padding: 0 10px;
    font-size: 12px;
    width: 220px;
    outline: none;
    &:focus {
      border-color: #e6a23c;
    }
  }
}

.db-body {
  padding: 14px 18px 14px;
}

.db-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 10px;

  .danger-bg {
    background: #fef0f0;
    color: #f56c6c;
    border: 1px solid #fbc4c4;
    height: 30px;
    padding: 0 12px;
    font-size: 12px;
    &:hover:not(:disabled) {
      background: #fde2e2;
    }
  }
  .ghost-strong {
    background: #fff;
    color: #606266;
    border: 1px solid #dcdfe6;
    height: 30px;
    padding: 0 12px;
    font-size: 12px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    border-radius: 6px;
    &:hover {
      border-color: #e6a23c;
      color: #e6a23c;
    }
  }
  .file-btn {
    line-height: 30px;
  }
}

.db-msg {
  font-size: 12px;
  padding: 6px 10px;
  border-radius: 6px;
  &.ok {
    background: #f0f9eb;
    color: #67c23a;
  }
  &.err {
    background: #fef0f0;
    color: #f56c6c;
  }
}

.status-spacer {
  flex: 1;
}

.user-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 10px;
  font-weight: 500;
  background: #f4f4f5;
  color: #606266;
  font-size: 12px;
  &.admin {
    background: #fdf6ec;
    color: #e6a23c;
  }
}

.auth-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.auth-card {
  width: 360px;
  max-width: 90vw;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.18);
}

.auth-header {
  display: flex;
  align-items: center;
  border-bottom: 1px solid #f0f0f0;
  background: linear-gradient(135deg, rgba(230, 162, 60, 0.06), rgba(245, 108, 108, 0.06));

  .tab {
    flex: 1;
    height: 44px;
    background: transparent;
    border: none;
    border-radius: 0;
    color: #909399;
    font-weight: 500;
    cursor: pointer;
    &.active {
      color: #e6a23c;
      box-shadow: inset 0 -2px 0 #e6a23c;
    }
  }
  .close {
    width: 44px;
    height: 44px;
    background: transparent;
    border: none;
    font-size: 20px;
    color: #909399;
    cursor: pointer;
  }
}

.auth-form {
  padding: 18px 20px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;

  label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 12px;
    color: #606266;

    input {
      height: 36px;
      border: 1px solid #dcdfe6;
      border-radius: 6px;
      padding: 0 10px;
      font-size: 13px;
      outline: none;
      &:focus {
        border-color: #e6a23c;
      }
    }
  }

  .auth-error {
    color: #f56c6c;
    font-size: 12px;
    background: #fef0f0;
    padding: 6px 10px;
    border-radius: 6px;
  }

  .auth-tip {
    font-size: 12px;
    color: #909399;
    text-align: center;
    code {
      background: #f4f4f5;
      padding: 1px 6px;
      border-radius: 4px;
    }
  }

  button[type='submit'] {
    height: 38px;
  }
}
</style>
