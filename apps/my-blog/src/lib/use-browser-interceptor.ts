import { onUnmounted } from 'vue'

interface IBrowserInterceptEvents {
  popstate?: (next: () => void) => void // 监听浏览器前进后退
}
let times = 0
function addFakeHistrory() {
  const state = { id: 'fakeHistory' }
  console.log('addFakeHistrory', times++)
  if (state.id !== 'fakeHistory') {
    window.history.pushState(state, '', window.location.href)
  }
}

export const useBrowserInterceptor = (events: IBrowserInterceptEvents) => {
  const { popstate } = events
  let popstateListener: (() => void) | null = null
  let isHistroryBack = false
  if (popstate) {
    addFakeHistrory()
    popstateListener = () => {
      addFakeHistrory()
      popstate(() => {
        isHistroryBack = true
        history.go(-2)
      })
    }
    window.addEventListener('popstate', popstateListener)
  }

  onUnmounted(() => {
    console.log('browser interceptor unmount')
    if (popstate && !isHistroryBack) {
      history.go(-1)
    }
    if (popstateListener) {
      window.removeEventListener('popstate', popstateListener)
    }
  })
}
