import { createApp, type App as VueApp } from 'vue'
import 'src/styles/global.css'
import { App } from 'src/app'
import router from 'src/router'
import {
  renderWithQiankun,
  qiankunWindow,
} from 'vite-plugin-qiankun/dist/helper'

let app: VueApp | undefined = undefined

const render = (props: unknown) => {
  console.log('子应用（viteApp）', props)
  app = createApp(App)
  app.use(router)
  app.mount('#app')
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
