import { createApp, type App as VueApp } from 'vue'
import naive from 'naive-ui'
import 'src/styles/global.css'
import { App } from 'src/app'
import router from 'src/router'
import { useAuth } from 'src/composables/use-auth'
import { syncSubAppUrlToHash } from 'src/lib/qiankun-base'
import { renderWithQiankun, qiankunWindow } from 'vite-plugin-qiankun/dist/helper'

let app: VueApp | undefined

declare global {
  interface Window {
    __POWERED_BY_QIANKUN__: boolean
    _QIANKUN_YD: {
      event: {
        on: (eventName: string, callback: (...args: unknown[]) => void) => void
        emit: (eventName: string, ...args: unknown[]) => void
        once: (eventName: string, callback: (...args: unknown[]) => void) => void
        off: (eventName: string, callback: (...args: unknown[]) => void) => void
        watch: (callback: (...args: unknown[]) => void) => void
      }
    }
  }
}

const render = async (props: unknown) => {
  console.log('子应用（viteApp）', props)
  const { container } = props as { container: HTMLElement }

  const pendingPath = qiankunWindow.__POWERED_BY_QIANKUN__ ? syncSubAppUrlToHash() : null

  const { restore } = useAuth()
  await restore()

  app = createApp(App)
  app.use(naive)
  app.use(router)
  if (pendingPath) {
    await router.replace(pendingPath)
  }
  await router.isReady()

  if (qiankunWindow.__POWERED_BY_QIANKUN__ && container) {
    app.mount(container)
  } else {
    app.mount('#app')
  }

  if (qiankunWindow.__POWERED_BY_QIANKUN__) {
    window._QIANKUN_YD.event.emit('loading', 'vue3')
  }
}

const initQianKun = () => {
  renderWithQiankun({
    bootstrap() {},
    mount(props) {
      void render(props)
    },
    unmount() {
      app?.unmount()
      app = undefined
    },
    update() {},
  })
}

// eslint-disable-next-line @typescript-eslint/no-unused-expressions
qiankunWindow.__POWERED_BY_QIANKUN__ ? initQianKun() : void render({})
