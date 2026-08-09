import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js/lib/common'

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

const md = new MarkdownIt({
  html: false, // 转义原始 HTML，避免 XSS
  linkify: true,
  breaks: true, // 单换行转 <br>，契合聊天场景
  highlight(str, lang): string {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return `<pre class="hljs"><code>${hljs.highlight(str, { language: lang, ignoreIllegals: true }).value}</code></pre>`
      } catch {
        // fallthrough
      }
    }
    return `<pre class="hljs"><code>${escapeHtml(str)}</code></pre>`
  },
})

export function renderMarkdown(src: string): string {
  return md.render(src)
}
