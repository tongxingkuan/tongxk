// 流式 Markdown 渲染：主线程做块级解析 + Prism 高亮
// - RAF 节流：高速 token 流不会触发上千次解析
// - (lang, text) 缓存已高亮的封口代码块，重复解析不重复高亮
// - 未封口代码块只渲染纯文本 + 光标，封口后一次性着色，避免闪烁
//
// 用法：
//   const { html, appendDelta, reset, dispose } = useStreamMarkdown()
//   appendDelta('xxx')         // 每次收到 SSE token 调用
//   <div v-html="html" />
//   reset()                    // 新一轮提问前清空
//   onBeforeUnmount(dispose)   // 释放资源（当前实现无副作用，保留 API 兼容）

import Prism from 'prismjs'
// 主流语言按需引入，按需扩展即可
import 'prismjs/components/prism-markup'
import 'prismjs/components/prism-css'
import 'prismjs/components/prism-clike'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-jsx'
import 'prismjs/components/prism-tsx'
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-bash'
import 'prismjs/components/prism-yaml'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-go'
import 'prismjs/components/prism-java'
import 'prismjs/components/prism-sql'
import 'prismjs/components/prism-markdown'

const LANG_ALIAS: Record<string, string> = {
  js: 'javascript',
  ts: 'typescript',
  sh: 'bash',
  shell: 'bash',
  zsh: 'bash',
  html: 'markup',
  xml: 'markup',
  vue: 'markup',
  yml: 'yaml',
  py: 'python',
}

function escapeHtml(s: string) {
  return s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c] as string)
}

function escapeAttr(s: string) {
  return s.replace(/"/g, '&quot;')
}

const hlCache = new Map<string, string>()

function highlight(code: string, lang: string): string {
  const real = LANG_ALIAS[lang] || lang
  const grammar = Prism.languages[real]
  if (!grammar) return escapeHtml(code)
  return Prism.highlight(code, grammar, real)
}

function renderInline(s: string): string {
  let out = escapeHtml(s)
  out = out.replace(/`([^`]+)`/g, (_m, c) => `<code>${c}</code>`)
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  out = out.replace(/\*([^*]+)\*/g, '<em>$1</em>')
  out = out.replace(
    /\[([^\]]+)\]\(([^)\s]+)\)/g,
    (_m, t, u) => `<a href="${escapeAttr(u)}" target="_blank" rel="noopener noreferrer">${t}</a>`,
  )
  return out
}

type Block =
  | { type: 'code', lang: string, text: string, closed: boolean }
  | { type: 'h', level: number, text: string }
  | { type: 'quote', text: string }
  | { type: 'list', ordered: boolean, items: string[] }
  | { type: 'p', text: string }

function parseBlocks(src: string): Block[] {
  const lines = src.split('\n')
  const blocks: Block[] = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (line.indexOf('```') === 0) {
      const lang = line.slice(3).trim()
      const codeLines: string[] = []
      i++
      let closed = false
      while (i < lines.length) {
        if (lines[i].indexOf('```') === 0) {
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
    const hMatch = /^(#{1,6})\s+(.*)$/.exec(line)
    if (hMatch) {
      blocks.push({ type: 'h', level: hMatch[1].length, text: hMatch[2] })
      i++
      continue
    }
    if (/^>\s?/.test(line)) {
      const quoteLines: string[] = []
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        quoteLines.push(lines[i].replace(/^>\s?/, ''))
        i++
      }
      blocks.push({ type: 'quote', text: quoteLines.join('\n') })
      continue
    }
    if (/^\s*[-*+]\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
      const ordered = /^\s*\d+\.\s+/.test(line)
      const items: string[] = []
      while (
        i < lines.length
        && ((ordered && /^\s*\d+\.\s+/.test(lines[i])) || (!ordered && /^\s*[-*+]\s+/.test(lines[i])))
      ) {
        items.push(lines[i].replace(/^\s*(?:[-*+]|\d+\.)\s+/, ''))
        i++
      }
      blocks.push({ type: 'list', ordered, items })
      continue
    }
    if (line.trim() === '') {
      i++
      continue
    }
    const pLines = [line]
    i++
    while (
      i < lines.length
      && lines[i].trim() !== ''
      && lines[i].indexOf('```') !== 0
      && !/^#{1,6}\s+/.test(lines[i])
      && !/^>\s?/.test(lines[i])
      && !/^\s*[-*+]\s+/.test(lines[i])
      && !/^\s*\d+\.\s+/.test(lines[i])
    ) {
      pLines.push(lines[i])
      i++
    }
    blocks.push({ type: 'p', text: pLines.join(' ') })
  }
  return blocks
}

function renderBlock(b: Block): string {
  if (b.type === 'code') {
    let inner: string
    if (b.closed) {
      const key = `${b.lang}::${b.text}`
      const cached = hlCache.get(key)
      if (cached) {
        inner = cached
      } else {
        inner = highlight(b.text, b.lang)
        hlCache.set(key, inner)
      }
    } else {
      inner = escapeHtml(b.text) + '<span class="caret">▌</span>'
    }
    const cls = 'sm-code language-' + escapeAttr(b.lang || 'text') + (b.closed ? '' : ' sm-code-unclosed')
    return `<pre class="${cls}"><code class="language-${escapeAttr(b.lang || 'text')}">${inner}</code></pre>`
  }
  if (b.type === 'h') return `<h${b.level}>${renderInline(b.text)}</h${b.level}>`
  if (b.type === 'quote') return `<blockquote>${renderInline(b.text).replace(/\n/g, '<br/>')}</blockquote>`
  if (b.type === 'list') {
    const tag = b.ordered ? 'ol' : 'ul'
    const lis = b.items.map(t => `<li>${renderInline(t)}</li>`).join('')
    return `<${tag}>${lis}</${tag}>`
  }
  return `<p>${renderInline(b.text)}</p>`
}

export interface StreamMarkdownAPI {
  html: import('vue').Ref<string>
  appendDelta: (delta: string) => void
  reset: () => void
  dispose: () => void
}

export function useStreamMarkdown(): StreamMarkdownAPI {
  const html = ref('')
  let pendingText = ''
  let scheduled = 0

  function render() {
    scheduled = 0
    const blocks = parseBlocks(pendingText)
    html.value = blocks.map(renderBlock).join('')
  }

  function appendDelta(delta: string) {
    if (!delta) return
    pendingText += delta
    if (scheduled) return
    scheduled = requestAnimationFrame(render)
  }

  function reset() {
    if (scheduled) cancelAnimationFrame(scheduled)
    scheduled = 0
    pendingText = ''
    html.value = ''
    hlCache.clear()
  }

  function dispose() {
    if (scheduled) cancelAnimationFrame(scheduled)
    scheduled = 0
  }

  return { html, appendDelta, reset, dispose }
}
