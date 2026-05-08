// 给页面内所有 <pre> 动态挂载一个复制按钮
// Nuxt Content 的 <ContentDoc> 是异步渲染，onMounted 时 <pre> 可能还没到位，
// 这里用 MutationObserver 监听，一旦出现新 <pre> 就挂上按钮
const COPY_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`

const DONE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><polyline points="20 6 9 17 4 12"></polyline></svg>`

const copyText = async (text: string) => {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      /* fallthrough */
    }
  }
  const ta = document.createElement('textarea')
  ta.value = text
  ta.style.position = 'fixed'
  ta.style.opacity = '0'
  document.body.appendChild(ta)
  ta.select()
  try {
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    document.body.removeChild(ta)
    return false
  }
}

const attachCopyBtn = (pre: HTMLElement) => {
  if (pre.dataset.copyReady === '1') return
  pre.dataset.copyReady = '1'

  const btn = document.createElement('button')
  btn.type = 'button'
  btn.className = 'copy-btn'
  btn.setAttribute('aria-label', '复制代码')
  btn.innerHTML = `${COPY_ICON}<span class="copy-btn-text">复制</span>`

  let resetTimer: number | undefined
  btn.addEventListener('click', async e => {
    e.stopPropagation()
    const code = pre.querySelector('code')
    const text = (code?.innerText ?? pre.innerText ?? '').replace(/\n?复制$/, '').replace(/\n?已复制$/, '')
    const ok = await copyText(text)
    btn.classList.toggle('is-success', ok)
    btn.classList.toggle('is-error', !ok)
    btn.innerHTML = ok
      ? `${DONE_ICON}<span class="copy-btn-text">已复制</span>`
      : `${COPY_ICON}<span class="copy-btn-text">失败</span>`
    window.clearTimeout(resetTimer)
    resetTimer = window.setTimeout(() => {
      btn.classList.remove('is-success', 'is-error')
      btn.innerHTML = `${COPY_ICON}<span class="copy-btn-text">复制</span>`
    }, 1500)
  })

  pre.appendChild(btn)
}

const scanAndBind = (root: ParentNode) => {
  root.querySelectorAll('pre').forEach(attachCopyBtn)
}

/**
 * 给指定根节点下所有 <pre> 挂上复制按钮，并监听后续新增的 <pre>
 * 返回一个停止监听的函数，组件卸载时调用以避免泄漏
 */
export function bindCodeCopy(root: HTMLElement | null | undefined) {
  if (typeof window === 'undefined') return () => {}
  const target = root ?? document.body
  // 立即处理已有的
  scanAndBind(target)

  const observer = new MutationObserver(mutations => {
    for (const m of mutations) {
      m.addedNodes.forEach(node => {
        if (!(node instanceof HTMLElement)) return
        if (node.tagName === 'PRE') {
          attachCopyBtn(node)
        } else {
          scanAndBind(node)
        }
      })
    }
  })
  observer.observe(target, { childList: true, subtree: true })

  return () => observer.disconnect()
}
