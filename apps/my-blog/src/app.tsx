import { createComponent } from 'shared'
import { RouterView } from 'vue-router'

export const App = createComponent(null, () => {
  const changeLang = (lang: string) => {
    window.localStorage.setItem('lang', lang)
    window.location.reload()
  }
  return () => (
    <div>
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
})

export default App
