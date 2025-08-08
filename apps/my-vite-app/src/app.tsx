import { defineComponent } from 'vue'
import { RouterView } from 'vue-router'

export const App = defineComponent({
  name: 'App',
  setup() {
    const changeLang = (lang: string) => {
      window.localStorage.setItem('lang', lang)
      window.location.reload()
    }

    return () => (
      <div>
        <h1>Vite App 测试</h1>
        <div class="operation">
          <button onClick={() => changeLang('zhcn')} style="margin-right: 10px">
            中文
          </button>
          <button onClick={() => changeLang('en')} style="margin-right: 10px">
            英文
          </button>
          <button onClick={() => changeLang('ko')} style="margin-right: 10px">
            韩文
          </button>
          <button onClick={() => changeLang('ja')} style="margin-right: 10px">
            日文
          </button>
        </div>
        <RouterView />
      </div>
    )
  },
})

export default App
