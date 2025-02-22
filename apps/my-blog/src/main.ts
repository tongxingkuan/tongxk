import { createApp, type App as VueApp } from 'vue'
import 'src/styles/global.css'
import { App } from 'src/app'
import router from 'src/router'
import {
  renderWithQiankun,
  qiankunWindow,
} from 'vite-plugin-qiankun/dist/helper'

let app: VueApp | undefined = undefined

declare global {
  interface Window {
    __POWERED_BY_QIANKUN__: boolean
    _QIANKUN_YD: {
      event: {
        on: (eventName: string, callback: (...args: unknown[]) => void) => void
        emit: (eventName: string, ...args: unknown[]) => void
        once: (
          eventName: string,
          callback: (...args: unknown[]) => void,
        ) => void
        off: (
          eventName: string,
          callback: (...args: unknown[]) => void,
        ) => void
        watch: (callback: (...args: unknown[]) => void) => void
      }
    }
  }
}

const render = (props: unknown) => {
  console.log('子应用（viteApp）', props)
  const { container } = props as { container: HTMLElement }
  app = createApp(App)
  app.use(router)
  app.mount(container ? container.querySelector('#app') : '#app')
  window._QIANKUN_YD.event.emit('loading', 'vue3')
}

const initQianKun = () => {
  renderWithQiankun({
    bootstrap() {},
    mount(props) {
      render(props)
    },
    unmount() {
      app?.unmount()
    },
    update() {},
  })
}

// eslint-disable-next-line @typescript-eslint/no-unused-expressions
qiankunWindow.__POWERED_BY_QIANKUN__ ? initQianKun() : render({})
