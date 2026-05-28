<template>
  <div class="home">
    <client-only>
      <particle :amountX="60" :amountY="60" class="particle-bg" />
    </client-only>
    <div class="hero-content">
      <h1 class="hero-title">
        <span class="title-text">童话的博客</span>
        <span class="title-sub">技术分享 · 实战演示 · 面试题解</span>
      </h1>

      <div class="nav-cards">
        <nuxt-link to="articles" class="nav-card articles-card">
          <div class="card-icon">📝</div>
          <div class="card-content">
            <span class="card-title">技术文章</span>
            <span class="card-desc">探索前沿技术，分享实战经验</span>
          </div>
          <div class="card-arrow">→</div>
        </nuxt-link>
        <nuxt-link to="demos" class="nav-card demos-card">
          <div class="card-icon">🎮</div>
          <div class="card-content">
            <span class="card-title">在线演示</span>
            <span class="card-desc">交互式Demo，展示技术能力</span>
          </div>
          <div class="card-arrow">→</div>
        </nuxt-link>
        <nuxt-link to="questions" class="nav-card questions-card">
          <div class="card-icon">💡</div>
          <div class="card-content">
            <span class="card-title">面试题库</span>
            <span class="card-desc">高频面试题，助你offer拿到手软</span>
          </div>
          <div class="card-arrow">→</div>
        </nuxt-link>
      </div>

      <div class="chat-section">
        <div class="chat-header">
          <span class="chat-icon">🤖</span>
          <span>AI 智能助手</span>
        </div>
        <div class="chat-input-wrapper">
          <input
            ref="inputRef"
            type="text"
            class="chat-input"
            v-model="question"
            :disabled="loading"
            placeholder="输入问题，我来帮你解答..."
            @keydown.enter="ask"
          />
          <button v-if="!loading" @click="ask" class="chat-btn" :disabled="!question">
            <span class="btn-text">提问</span>
            <span class="btn-icon">↵</span>
          </button>
          <button v-else @click="stop" class="chat-btn stop-btn">
            <span class="btn-text">停止</span>
            <span class="btn-icon">■</span>
          </button>
        </div>
      </div>

      <client-only>
        <div ref="responseRef" class="chat-response" v-if="renderedHtml || loading">
          <div v-if="!renderedHtml && loading" class="thinking">
            <span class="dot" /><span class="dot" /><span class="dot" />
            <span>思考中…</span>
          </div>
          <div v-else class="response-preview" v-html="renderedHtml" />
        </div>
      </client-only>

      <transition name="fade">
        <button v-if="showScrollBtn" class="scroll-bottom-btn" @click="scrollToBottom(true)" aria-label="回到底部">
          ↓ 回到底部
        </button>
      </transition>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { fetchEventSource } from '@microsoft/fetch-event-source'
import { useStreamMarkdown } from '~/composables/useStreamMarkdown'

const question = ref('')
const loading = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)
const responseRef = ref<HTMLElement | null>(null)
const autoScroll = ref(true)
const showScrollBtn = ref(false)
const { html: renderedHtml, appendDelta, reset, dispose } = useStreamMarkdown()

let abortCtrl: AbortController | null = null
let scrollRaf = 0
let onScrollListener: (() => void) | null = null

const getScrollTop = () => window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0

const getMaxScroll = () => {
  const doc = document.documentElement
  return Math.max(doc.scrollHeight, document.body.scrollHeight) - window.innerHeight
}

const isNearBottom = (threshold = 80) => getMaxScroll() - getScrollTop() <= threshold

const scrollToBottom = (force = false) => {
  if (scrollRaf) cancelAnimationFrame(scrollRaf)
  scrollRaf = requestAnimationFrame(() => {
    if (force) autoScroll.value = true
    if (!autoScroll.value) return
    window.scrollTo({ top: getMaxScroll(), behavior: force ? 'smooth' : 'auto' })
    showScrollBtn.value = false
  })
}

const handleUserScroll = () => {
  const near = isNearBottom()
  autoScroll.value = near
  showScrollBtn.value = !near && (loading.value || !!renderedHtml.value)
}

watch(renderedHtml, () => {
  if (autoScroll.value) scrollToBottom()
  else showScrollBtn.value = true
})

onMounted(() => {
  onScrollListener = handleUserScroll
  window.addEventListener('scroll', onScrollListener, { passive: true })
})

onBeforeUnmount(() => {
  dispose()
  abortCtrl?.abort()
  if (scrollRaf) cancelAnimationFrame(scrollRaf)
  if (onScrollListener) window.removeEventListener('scroll', onScrollListener)
})

const stop = () => {
  abortCtrl?.abort()
  abortCtrl = null
  loading.value = false
  nextTick(() => inputRef.value?.focus())
}

const ask = () => {
  const q = question.value.trim()
  if (!q || loading.value) return

  loading.value = true
  reset()
  autoScroll.value = true
  showScrollBtn.value = false
  question.value = ''
  abortCtrl?.abort()
  abortCtrl = new AbortController()

  // Make sure the response area is in view as soon as it appears.
  nextTick(() => scrollToBottom())

  fetchEventSource('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'text/event-stream;charset=utf-8',
      accept: 'text/event-stream',
    },
    openWhenHidden: true,
    credentials: 'include',
    signal: abortCtrl.signal,
    body: JSON.stringify({ question: q }),
    onmessage(e) {
      if (!e || !e.data) return
      let res
      try {
        res = JSON.parse(e.data)
      } catch (error) {
        return
      }
      if (!res) return
      const { text } = res
      if (text) appendDelta(text)
    },
    onerror(e) {
      console.log('error', e)
      loading.value = false
      nextTick(() => inputRef.value?.focus())
      throw e
    },
    onclose() {
      loading.value = false
      nextTick(() => inputRef.value?.focus())
    },
  })
}
</script>
<style lang="less" scoped>
.home {
  width: 100vw;
  min-height: 100vh;
  overflow: auto;
  position: relative;
  background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
}

.particle-bg {
  position: fixed !important;
  top: 0;
  left: 0;
  width: 100% !important;
  height: 100% !important;
  z-index: 0;
}

.hero-content {
  position: relative;
  z-index: 1;
  max-width: 900px;
  margin: 0 auto;
  padding: 60px 20px 40px;
}

.hero-title {
  text-align: center;
  margin-bottom: 50px;

  .title-text {
    display: block;
    font-size: 56px;
    font-weight: 700;
    color: #fff;
    letter-spacing: 4px;
    text-shadow: 0 4px 20px rgba(23, 133, 207, 0.5);
    margin-bottom: 16px;
  }

  .title-sub {
    display: block;
    font-size: 18px;
    color: rgba(255, 255, 255, 0.7);
    letter-spacing: 8px;
  }
}

.nav-cards {
  display: flex;
  gap: 24px;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 50px;
}

.nav-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px 32px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  color: #fff;
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 240px;

  &:hover {
    transform: translateY(-4px);
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(23, 133, 207, 0.5);
    box-shadow: 0 8px 32px rgba(23, 133, 207, 0.3);

    .card-arrow {
      transform: translateX(4px);
    }
  }

  .card-icon {
    font-size: 36px;
    line-height: 1;
  }

  .card-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .card-title {
    font-size: 18px;
    font-weight: 600;
  }

  .card-desc {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.6);
  }

  .card-arrow {
    font-size: 20px;
    color: rgba(255, 255, 255, 0.5);
    transition: transform 0.3s ease;
  }
}

.articles-card:hover {
  border-color: rgba(103, 194, 58, 0.6);
  box-shadow: 0 8px 32px rgba(103, 194, 58, 0.3);
}

.demos-card:hover {
  border-color: rgba(230, 162, 60, 0.6);
  box-shadow: 0 8px 32px rgba(230, 162, 60, 0.3);
}

.questions-card:hover {
  border-color: rgba(64, 158, 255, 0.6);
  box-shadow: 0 8px 32px rgba(64, 158, 255, 0.3);
}

.chat-section {
  max-width: 600px;
  margin: 0 auto 30px;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 20px;
}

.chat-header {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #fff;
  font-size: 16px;
  margin-bottom: 16px;
  font-weight: 500;

  .chat-icon {
    font-size: 24px;
  }
}

.chat-input-wrapper {
  display: flex;
  gap: 12px;
}

.chat-input {
  flex: 1;
  padding: 14px 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  font-size: 15px;
  outline: none;
  transition: all 0.3s ease;

  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }

  &:focus {
    border-color: rgba(23, 133, 207, 0.6);
    background: rgba(255, 255, 255, 0.08);
    box-shadow: 0 0 0 3px rgba(23, 133, 207, 0.15);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.chat-btn {
  padding: 14px 28px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #1785cf 0%, #409eff 100%);
  color: #fff;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.02);
    box-shadow: 0 4px 20px rgba(23, 133, 207, 0.4);
  }

  &:active {
    transform: scale(0.98);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .btn-icon {
    font-size: 14px;
  }
}

.stop-btn {
  background: linear-gradient(135deg, #f56c6c 0%, #e74c3c 100%);
  &:hover {
    box-shadow: 0 4px 20px rgba(245, 108, 108, 0.4);
  }
}

.scroll-bottom-btn {
  position: fixed;
  right: 24px;
  bottom: 32px;
  z-index: 10;
  padding: 10px 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  background: rgba(23, 133, 207, 0.85);
  color: #fff;
  font-size: 13px;
  cursor: pointer;
  backdrop-filter: blur(8px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  transition: all 0.2s ease;

  &:hover {
    background: rgba(23, 133, 207, 1);
    transform: translateY(-2px);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

.chat-response {
  max-width: 800px;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.response-preview {
  color: #303133;
  font-size: 15px;
  line-height: 1.75;
  word-break: break-word;

  :deep(h1),
  :deep(h2),
  :deep(h3),
  :deep(h4) {
    font-weight: 600;
    margin: 16px 0 10px;
    color: #1f2937;
  }
  :deep(h1) {
    font-size: 22px;
  }
  :deep(h2) {
    font-size: 18px;
  }
  :deep(h3) {
    font-size: 16px;
  }
  :deep(p) {
    margin: 8px 0;
  }
  :deep(ul),
  :deep(ol) {
    padding-left: 1.5em;
    margin: 8px 0;
  }
  :deep(blockquote) {
    border-left: 3px solid #1785cf;
    padding: 4px 12px;
    margin: 10px 0;
    color: #555;
    background: rgba(23, 133, 207, 0.06);
  }
  :deep(a) {
    color: #1785cf;
    text-decoration: underline;
  }
  :deep(code) {
    background: rgba(0, 0, 0, 0.06);
    padding: 1px 6px;
    border-radius: 4px;
    font-family: 'JetBrains Mono', Menlo, Consolas, monospace;
    font-size: 13px;
  }
  :deep(pre.sm-code) {
    position: relative;
    background: #1f2937;
    color: #f9fafb;
    padding: 12px 14px;
    border-radius: 8px;
    overflow: auto;
    margin: 10px 0;
    font-size: 13px;
    line-height: 1.6;
    code {
      background: transparent;
      padding: 0;
      color: inherit;
    }
    .token.comment,
    .token.prolog,
    .token.doctype,
    .token.cdata {
      color: #94a3b8;
      font-style: italic;
    }
    .token.punctuation {
      color: #cbd5e1;
    }
    .token.namespace {
      opacity: 0.7;
    }
    .token.property,
    .token.tag,
    .token.boolean,
    .token.number,
    .token.constant,
    .token.symbol,
    .token.deleted {
      color: #fcd34d;
    }
    .token.selector,
    .token.attr-name,
    .token.string,
    .token.char,
    .token.builtin,
    .token.inserted {
      color: #86efac;
    }
    .token.operator,
    .token.entity,
    .token.url,
    .language-css .token.string,
    .style .token.string {
      color: #f9a8d4;
    }
    .token.atrule,
    .token.attr-value,
    .token.keyword {
      color: #f59e0b;
    }
    .token.function,
    .token.class-name {
      color: #60a5fa;
    }
    .token.regex,
    .token.important,
    .token.variable {
      color: #fda4af;
    }
    .token.important,
    .token.bold {
      font-weight: bold;
    }
    .token.italic {
      font-style: italic;
    }
    .caret {
      display: inline-block;
      margin-left: 2px;
      color: #67c23a;
      animation: smCaret 1s steps(1) infinite;
    }
  }
  :deep(pre.sm-code-unclosed) {
    border-left: 3px solid #67c23a;
  }
}

@keyframes smCaret {
  50% {
    opacity: 0;
  }
}

.thinking {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #888;
  font-size: 14px;
  padding: 6px 0;
  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #1785cf;
    animation: thinkBlink 1.2s infinite;
    &:nth-child(2) {
      animation-delay: 0.2s;
    }
    &:nth-child(3) {
      animation-delay: 0.4s;
    }
  }
  span:last-child {
    margin-left: 6px;
  }
}
@keyframes thinkBlink {
  0%,
  80%,
  100% {
    opacity: 0.3;
    transform: scale(0.8);
  }
  40% {
    opacity: 1;
    transform: scale(1);
  }
}

@media (max-width: 768px) {
  .hero-title .title-text {
    font-size: 36px;
    letter-spacing: 2px;
  }

  .hero-title .title-sub {
    font-size: 14px;
    letter-spacing: 4px;
  }

  .nav-cards {
    flex-direction: column;
    align-items: center;
  }

  .nav-card {
    width: 100%;
    max-width: 300px;
  }

  .chat-input-wrapper {
    flex-direction: column;
  }

  .chat-btn {
    justify-content: center;
  }
}
</style>
