<template>
  <Title>流式渲染 + Worker 高亮</Title>
  <ClientOnly>
    <div class="stream-demo">
      <div class="intro">
        <h2>流式渲染 + Worker 高亮 Demo</h2>
        <p>
          模拟 LLM 流式吐字，左右两栏分别用 <b>主线程</b> 和 <b>Web Worker</b> 做代码高亮。
          下方"输入流畅度测试"框尝试连续打字，体验主线程被阻塞时输入会"吞字 / 抖动"。
        </p>
      </div>

      <div class="controls">
        <div class="ctrl-row">
          <label>运行模式</label>
          <div class="seg">
            <button
              v-for="m in modes"
              :key="m.value"
              class="seg-btn"
              :class="{ active: mode === m.value }"
              :disabled="streaming"
              @click="mode = m.value"
            >
              {{ m.label }}
            </button>
          </div>
          <span class="ctrl-tip">⤷ 想看 FPS 差异，请分别跑「仅主线程」和「仅 Worker」对比</span>
        </div>
        <div class="ctrl-row">
          <label>速度（ms/token）</label>
          <input v-model.number="tokenInterval" type="range" min="0" max="50" step="1" />
          <span class="ctrl-val">{{ tokenInterval }}ms</span>
        </div>
        <div class="ctrl-row">
          <label>每个代码块 token 高亮耗时</label>
          <input v-model.number="highlightCost" type="range" min="0" max="80" step="2" />
          <span class="ctrl-val">{{ highlightCost }}ms</span>
          <span class="ctrl-tip">⤷ 模拟 Shiki/Prism 在长代码块上的耗时</span>
        </div>
        <div class="ctrl-row btns">
          <button class="btn primary" :disabled="streaming" @click="start">▶ 开始流式输出</button>
          <button class="btn" :disabled="!streaming" @click="stop">■ 停止</button>
          <button class="btn" :disabled="streaming" @click="reset">↺ 重置</button>
          <span class="metric">
            已生成 {{ tokensSent }} token
            <span v-if="lastRunMode" class="run-tag" :class="lastRunMode">本轮：{{ lastRunModeLabel }}</span>
          </span>
        </div>
      </div>

      <div class="panes" :class="'mode-' + mode">
        <section v-if="mode !== 'worker'" class="pane">
          <header class="pane-head main">
            <span class="dot" />
            主线程高亮
            <span v-if="mainBusyMs > 0" class="busy">本次渲染阻塞 {{ mainBusyMs }}ms</span>
          </header>
          <div ref="mainPaneRef" class="pane-body" v-html="mainHtml" />
        </section>

        <section v-if="mode !== 'main'" class="pane">
          <header class="pane-head worker">
            <span class="dot" />
            Web Worker 高亮
            <span v-if="workerPending > 0" class="busy good">后台 {{ workerPending }} 个块排队中</span>
          </header>
          <div ref="workerPaneRef" class="pane-body" v-html="workerHtml" />
        </section>
      </div>

      <div class="probe">
        <div class="probe-head">
          <span>⌨️ 输入流畅度测试</span>
          <span class="probe-tip">
            FPS：<b :class="fpsClass">{{ fps }}</b> &nbsp;|&nbsp; 最近一帧间隔：<b>{{ lastFrameGap }}ms</b>
          </span>
        </div>
        <input
          v-model="probeText"
          class="probe-input"
          placeholder="开始流式输出后，在这里连续打字。主线程版被阻塞时会感觉到吞字 / 卡顿。"
        />
      </div>

      <div class="explain">
        <h3>怎么看出差异</h3>
        <ol>
          <li>把"高亮耗时"拉到 <b>40ms 左右</b>（模拟真实 Shiki/Prism 的开销）</li>
          <li>选择 <b>「仅主线程」</b>，开始流式 → 立刻在下方输入框连续打字，会明显感觉吞字、FPS 掉到 30 以下</li>
          <li>停下、点 ↺ 重置，切到 <b>「仅 Worker」</b>，再跑一次 → 输入框始终丝滑，FPS 稳定 60</li>
          <li>
            "同时"模式仅作 UI 展示对比，因为主线程已经被左栏占着，输入框两边都会卡 —— 这正是 demo 想说明的：<b
              >FPS 看的是当前主线程负载，与谁渲染无关</b
            >
          </li>
        </ol>
        <h3>这个 Demo 在演示什么</h3>
        <ul>
          <li><b>流式渲染</b>：累积字符串模拟 SSE token 流，每来一个 token 重新切块、对最后一个未封口块保留光标</li>
          <li><b>主线程高亮</b>：每次 token 到达，<code>highlight()</code> 在主线程同步耗时（滑块控制）</li>
          <li>
            <b>Worker 高亮</b>：耗时函数搬到 worker，主线程只发 postMessage、收 HTML 字符串。 未封口块先显示纯文本（带 ▌
            光标），封口后一次性着色，避免来回闪烁
          </li>
          <li>FPS / 帧间隔由 <code>requestAnimationFrame</code> 实测，掉到 30 以下肉眼能感觉到不流畅</li>
        </ul>
      </div>
    </div>

    <template #fallback>
      <div class="stream-demo">加载中…</div>
    </template>
  </ClientOnly>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'demo',
  pageTransition: { name: 'demos' },
})

// ---------- 模拟的 "LLM 流式" 文本 ----------
const SCRIPT = `# 流式 Markdown 演示

下面是 LLM 在流式吐字，注意右侧 Worker 版即使代码块再大，输入框也不会卡。

## 一段普通文本

ProseMirror 用 schema 约束文档结构，Tiptap 把 schema、命令、键位封装成 Extension。流式输出时最容易出问题的是 Markdown 的中途状态：未闭合的代码块会被解析成普通段落，等到 \`\`\` 收齐才跳成代码块。

## 一个稍长的代码块

\`\`\`ts
async function streamChat(question: string, onDelta: (t: string) => void) {
  const res = await fetch('/api/rag/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  })
  if (!res.body) throw new Error('no stream')
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const events = buffer.split('\\n\\n')
    buffer = events.pop() ?? ''
    for (const evt of events) {
      const line = evt.split('\\n').find(l => l.startsWith('data:'))
      if (!line) continue
      const payload = line.slice(5).trim()
      if (payload === '[DONE]') return
      const { delta } = JSON.parse(payload)
      onDelta(delta)
    }
  }
}
\`\`\`

## 再来一段普通文本

代码块高亮在长代码上单次可能花 50–200ms。如果跟解析一起在主线程同步跑，输入、滚动都会卡。把高亮放进 worker，主线程只接收着色后的 HTML，输入丝滑。`

// ---------- 流控状态 ----------
const tokenInterval = ref(8)
const highlightCost = ref(30)
const streaming = ref(false)
const tokensSent = ref(0)
const fullText = ref('')

type Mode = 'main' | 'worker' | 'both'
const mode = ref<Mode>('main') // 默认仅主线程，方便用户先感受卡顿
const lastRunMode = ref<Mode | ''>('')
const modes: { value: Mode; label: string }[] = [
  { value: 'main', label: '仅主线程（卡）' },
  { value: 'worker', label: '仅 Worker（流畅）' },
  { value: 'both', label: '同时（仅作展示对比）' },
]
const lastRunModeLabel = computed(() => modes.find(m => m.value === lastRunMode.value)?.label ?? '')

const mainHtml = ref('')
const workerHtml = ref('')

const mainBusyMs = ref(0)
const workerPending = ref(0)

let timer: number | null = null

// ---------- 极简 Markdown 渲染（够这个 Demo 用） ----------
function escapeHtml(s: string) {
  return s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c] as string)
}

function renderInline(s: string) {
  return escapeHtml(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
}

// 把流式文本切成"已封口块"和"最后未完成块"
type Block = { type: 'p' | 'h1' | 'h2' | 'code'; lang?: string; text: string; closed: boolean }

function parseBlocks(src: string): Block[] {
  const blocks: Block[] = []
  const lines = src.split('\n')
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim()
      const codeLines: string[] = []
      i++
      let closed = false
      while (i < lines.length) {
        if (lines[i].startsWith('```')) {
          closed = true
          i++
          break
        }
        codeLines.push(lines[i])
        i++
      }
      blocks.push({ type: 'code', lang, text: codeLines.join('\n'), closed })
      continue
    }
    if (line.startsWith('## ')) {
      blocks.push({ type: 'h2', text: line.slice(3), closed: true })
      i++
      continue
    }
    if (line.startsWith('# ')) {
      blocks.push({ type: 'h1', text: line.slice(2), closed: true })
      i++
      continue
    }
    if (line.trim() === '') {
      i++
      continue
    }
    // 段落：连续非空行
    const pLines: string[] = [line]
    i++
    while (i < lines.length && lines[i].trim() !== '' && !lines[i].startsWith('```') && !lines[i].startsWith('#')) {
      pLines.push(lines[i])
      i++
    }
    blocks.push({ type: 'p', text: pLines.join(' '), closed: true })
  }
  return blocks
}

// ---------- 主线程"重"高亮 ----------
function busyHighlight(code: string, costMs: number): string {
  // 简易关键字高亮
  const html = escapeHtml(code)
    .replace(
      /\b(async|await|function|const|let|var|return|if|else|while|for|true|false|null|new|throw|break|class|import|from|export|try|catch)\b/g,
      '<span class="kw">$1</span>'
    )
    .replace(/'([^']*)'/g, '<span class="str">\'$1\'</span>')
    .replace(/"([^"]*)"/g, '<span class="str">"$1"</span>')
    .replace(/\/\/.*$/gm, '<span class="cmt">$&</span>')

  // 模拟"重活"：在主线程上忙等 costMs
  if (costMs > 0) {
    const start = performance.now()
    // eslint-disable-next-line no-empty
    while (performance.now() - start < costMs) {}
  }
  return html
}

function blocksToHtml(blocks: Block[], highlight: (code: string) => string): string {
  return blocks
    .map(b => {
      if (b.type === 'code') {
        const cls = b.closed ? 'code' : 'code unclosed'
        return `<pre class="${cls}"><code class="lang-${b.lang || ''}">${highlight(b.text)}</code>${
          b.closed ? '' : '<span class="caret">▌</span>'
        }</pre>`
      }
      if (b.type === 'h1') return `<h1>${renderInline(b.text)}</h1>`
      if (b.type === 'h2') return `<h2>${renderInline(b.text)}</h2>`
      return `<p>${renderInline(b.text)}</p>`
    })
    .join('')
}

// ---------- Web Worker：内联创建 ----------
let worker: Worker | null = null
function createWorker() {
  const code = `
    function escapeHtml(s){return s.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'})[c])}
    function highlight(code, costMs){
      const html = escapeHtml(code)
        .replace(/\\b(async|await|function|const|let|var|return|if|else|while|for|true|false|null|new|throw|break|class|import|from|export|try|catch)\\b/g,'<span class="kw">$1</span>')
        .replace(/'([^']*)'/g,'<span class="str">\\'$1\\'</span>')
        .replace(/"([^"]*)"/g,'<span class="str">"$1"</span>')
        .replace(/\\/\\/.*$/gm,'<span class="cmt">$&</span>')
      if (costMs > 0) {
        const start = performance.now()
        while (performance.now() - start < costMs) {}
      }
      return html
    }
    self.onmessage = (e) => {
      const { id, code, costMs } = e.data
      const html = highlight(code, costMs)
      self.postMessage({ id, html })
    }
  `
  const blob = new Blob([code], { type: 'application/javascript' })
  return new Worker(URL.createObjectURL(blob))
}

// ---------- 渲染：主线程版本（同步阻塞） ----------
function renderMain() {
  const blocks = parseBlocks(fullText.value)
  const t0 = performance.now()
  mainHtml.value = blocksToHtml(blocks, code => busyHighlight(code, highlightCost.value))
  mainBusyMs.value = Math.round(performance.now() - t0)
}

// ---------- 渲染：Worker 版本（异步、不阻塞，且不闪烁） ----------
let workerReqId = 0
const workerCache = new Map<string, string>() // 同一段代码避免重复打到 worker / 重复回退
const pendingWorker = new Map<number, { cacheKey: string }>()

function buildWorkerHtml(blocks: Block[]): string {
  return blocks
    .map(b => {
      if (b.type === 'code') {
        const cacheKey = `${b.lang}::${b.text}`
        // 已着色过：直接用缓存；尚未着色（还在流 / worker 未返回）：用纯文本兜底
        const inner = workerCache.get(cacheKey) ?? escapeHtml(b.text)
        const cls = b.closed ? 'code' : 'code unclosed'
        return `<pre class="${cls}"><code class="lang-${b.lang || ''}">${inner}</code>${
          b.closed ? '' : '<span class="caret">▌</span>'
        }</pre>`
      }
      if (b.type === 'h1') return `<h1>${renderInline(b.text)}</h1>`
      if (b.type === 'h2') return `<h2>${renderInline(b.text)}</h2>`
      return `<p>${renderInline(b.text)}</p>`
    })
    .join('')
}

function renderWorker() {
  const blocks = parseBlocks(fullText.value)
  workerHtml.value = buildWorkerHtml(blocks)

  // 仅对【已封口】、未缓存、且未在排队中的代码块发到 worker
  // 未封口块每 tick 文本都在变，发了也作废，索性等它封口
  blocks.forEach(b => {
    if (b.type !== 'code' || !b.closed) return
    const cacheKey = `${b.lang}::${b.text}`
    if (workerCache.has(cacheKey)) return
    for (const p of pendingWorker.values()) {
      if (p.cacheKey === cacheKey) return
    }
    const id = ++workerReqId
    pendingWorker.set(id, { cacheKey })
    worker?.postMessage({ id, code: b.text, costMs: highlightCost.value })
  })
  workerPending.value = pendingWorker.size
}

// ---------- 流式驱动 ----------
function start() {
  if (streaming.value) return
  reset()
  streaming.value = true
  lastRunMode.value = mode.value
  let idx = 0
  const tick = () => {
    if (!streaming.value) return
    if (idx >= SCRIPT.length) {
      streaming.value = false
      return
    }
    // 一次推 1~3 个字符更接近真实 token 颗粒
    const step = 1 + Math.floor(Math.random() * 2)
    const next = SCRIPT.slice(idx, idx + step)
    idx += step
    fullText.value += next
    tokensSent.value += next.length

    // 关键：按选中模式只跑对应的渲染，FPS 探针才有对照
    if (mode.value !== 'worker') renderMain()
    if (mode.value !== 'main') renderWorker()

    timer = window.setTimeout(tick, tokenInterval.value)
  }
  tick()
}

function stop() {
  streaming.value = false
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
}

function reset() {
  stop()
  fullText.value = ''
  tokensSent.value = 0
  mainHtml.value = ''
  workerHtml.value = ''
  mainBusyMs.value = 0
  workerPending.value = 0
  pendingWorker.clear()
  workerCache.clear()
}

// ---------- 输入流畅度探针 ----------
const probeText = ref('')
const fps = ref(60)
const lastFrameGap = ref(16)
const fpsClass = computed(() => {
  if (fps.value >= 50) return 'fps-good'
  if (fps.value >= 30) return 'fps-mid'
  return 'fps-bad'
})

let rafHandle = 0
let lastTs = 0
let frameCount = 0
let fpsSampleStart = 0
function frameLoop(ts: number) {
  if (lastTs > 0) lastFrameGap.value = Math.round(ts - lastTs)
  lastTs = ts
  frameCount++
  if (ts - fpsSampleStart >= 500) {
    fps.value = Math.round((frameCount * 1000) / (ts - fpsSampleStart))
    fpsSampleStart = ts
    frameCount = 0
  }
  rafHandle = requestAnimationFrame(frameLoop)
}

onMounted(() => {
  worker = createWorker()
  worker.onmessage = (e: MessageEvent) => {
    const { id, html } = e.data
    const meta = pendingWorker.get(id)
    if (!meta) return
    pendingWorker.delete(id)
    workerCache.set(meta.cacheKey, html)
    // 用最新 blocks 重渲一次，缓存命中即可显示着色 HTML
    workerHtml.value = buildWorkerHtml(parseBlocks(fullText.value))
    workerPending.value = pendingWorker.size
  }
  fpsSampleStart = performance.now()
  rafHandle = requestAnimationFrame(frameLoop)
})

onBeforeUnmount(() => {
  stop()
  cancelAnimationFrame(rafHandle)
  worker?.terminate()
  worker = null
})
</script>

<style lang="less" scoped>
.stream-demo {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 32px 64px;
}

.intro {
  margin-bottom: 16px;
  h2 {
    margin: 0 0 8px;
    font-size: 22px;
    font-weight: 600;
  }
  p {
    margin: 0;
    font-size: 14px;
    color: #666;
    b {
      color: #e6a23c;
    }
  }
}

.controls {
  background: #fff;
  border: 1px solid rgba(230, 162, 60, 0.2);
  border-radius: 12px;
  padding: 14px 18px;
  margin-bottom: 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
  .ctrl-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 6px 0;
    font-size: 13px;
    color: #444;
    label {
      width: 200px;
      flex-shrink: 0;
    }
    input[type='range'] {
      flex: 1;
      max-width: 320px;
    }
    .ctrl-val {
      width: 60px;
      font-family: 'JetBrains Mono', Menlo, monospace;
      color: #e6a23c;
    }
    .ctrl-tip {
      font-size: 12px;
      color: #999;
    }
    &.btns {
      gap: 8px;
      margin-top: 12px;
    }
    .metric {
      margin-left: auto;
      font-size: 12px;
      color: #888;
      font-family: 'JetBrains Mono', Menlo, monospace;
    }
  }
}

.btn {
  padding: 6px 14px;
  font-size: 13px;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 6px;
  cursor: pointer;
  &:hover:not(:disabled) {
    border-color: #e6a23c;
    color: #e6a23c;
  }
  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
  &.primary {
    background: #e6a23c;
    border-color: #e6a23c;
    color: #fff;
    &:hover:not(:disabled) {
      filter: brightness(1.05);
      color: #fff;
    }
  }
}

.panes {
  display: grid;
  gap: 16px;
  &.mode-main,
  &.mode-worker {
    grid-template-columns: 1fr;
  }
  &.mode-both {
    grid-template-columns: 1fr 1fr;
  }
}

.seg {
  display: inline-flex;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 6px;
  overflow: hidden;
}
.seg-btn {
  padding: 5px 12px;
  font-size: 12px;
  background: #fff;
  border: none;
  border-right: 1px solid rgba(0, 0, 0, 0.08);
  cursor: pointer;
  color: #555;
  transition: all 0.15s;
  &:last-child {
    border-right: none;
  }
  &:hover:not(:disabled) {
    background: rgba(230, 162, 60, 0.08);
    color: #e6a23c;
  }
  &.active {
    background: #e6a23c;
    color: #fff;
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.run-tag {
  margin-left: 8px;
  padding: 1px 8px;
  font-size: 11px;
  border-radius: 10px;
  &.main {
    background: rgba(245, 108, 108, 0.15);
    color: #c0392b;
  }
  &.worker {
    background: rgba(103, 194, 58, 0.15);
    color: #389e0d;
  }
  &.both {
    background: rgba(0, 0, 0, 0.08);
    color: #555;
  }
}

.pane {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
}

.pane-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 500;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }
  &.main {
    background: rgba(245, 108, 108, 0.08);
    color: #c0392b;
    .dot {
      background: #f56c6c;
    }
  }
  &.worker {
    background: rgba(103, 194, 58, 0.08);
    color: #389e0d;
    .dot {
      background: #67c23a;
    }
  }
  .busy {
    margin-left: auto;
    font-size: 11px;
    color: #f56c6c;
    font-family: 'JetBrains Mono', Menlo, monospace;
    &.good {
      color: #67c23a;
    }
  }
}

.pane-body {
  padding: 14px 18px;
  min-height: 380px;
  max-height: 480px;
  overflow: auto;
  font-size: 14px;
  line-height: 1.7;
  color: #303133;

  :deep(h1) {
    font-size: 18px;
    margin: 0 0 12px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    padding-bottom: 6px;
  }
  :deep(h2) {
    font-size: 15px;
    margin: 18px 0 8px;
    color: #444;
  }
  :deep(p) {
    margin: 0 0 10px;
  }
  :deep(code) {
    background: rgba(0, 0, 0, 0.06);
    padding: 1px 6px;
    border-radius: 4px;
    font-family: 'JetBrains Mono', Menlo, monospace;
    font-size: 12.5px;
  }
  :deep(pre.code) {
    position: relative;
    background: #1f2937;
    color: #f9fafb;
    padding: 12px 14px;
    border-radius: 8px;
    overflow: auto;
    margin: 0 0 12px;
    font-size: 12.5px;
    line-height: 1.6;
    code {
      background: transparent;
      padding: 0;
      color: inherit;
    }
    .kw {
      color: #f59e0b;
    }
    .str {
      color: #86efac;
    }
    .cmt {
      color: #94a3b8;
      font-style: italic;
    }
  }
  :deep(pre.code.unclosed) {
    border-left: 3px solid #67c23a;
  }
  :deep(.caret) {
    display: inline-block;
    margin-left: 4px;
    color: #67c23a;
    animation: blink 1s steps(1) infinite;
  }
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}

.probe {
  margin-top: 18px;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 12px;
  padding: 14px 18px;
  .probe-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 13px;
    margin-bottom: 8px;
    color: #444;
    .probe-tip {
      font-family: 'JetBrains Mono', Menlo, monospace;
      font-size: 12px;
      color: #666;
      .fps-good {
        color: #67c23a;
      }
      .fps-mid {
        color: #e6a23c;
      }
      .fps-bad {
        color: #f56c6c;
      }
    }
  }
  .probe-input {
    width: 100%;
    padding: 10px 12px;
    font-size: 14px;
    border: 1px solid rgba(0, 0, 0, 0.12);
    border-radius: 6px;
    outline: none;
    &:focus {
      border-color: #e6a23c;
    }
  }
}

.explain {
  margin-top: 24px;
  background: #fff;
  border-radius: 12px;
  padding: 16px 22px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  h3 {
    margin: 0 0 10px;
    font-size: 15px;
  }
  ul {
    margin: 0;
    padding-left: 22px;
    font-size: 13px;
    line-height: 1.8;
    color: #555;
    code {
      background: rgba(0, 0, 0, 0.06);
      padding: 1px 6px;
      border-radius: 4px;
      font-family: 'JetBrains Mono', Menlo, monospace;
      font-size: 12px;
    }
  }
}

@media (max-width: 900px) {
  .panes {
    grid-template-columns: 1fr;
  }
  .stream-demo {
    padding: 16px;
  }
}
</style>
