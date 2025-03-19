import { createComponent } from 'shared'
import { useBrowserInterceptor } from 'src/lib/use-browser-interceptor'
import { ref } from 'vue'

export const Article1Page = createComponent(null, () => {
  const saved = ref(true)
  const inputValue = ref('')

  useBrowserInterceptor({
    popstate: next => {
      if (!saved.value) {
        const confirm = window.confirm('请先保存')
        if (confirm) {
          saved.value = true
          next()
        }
      }
    },
  })

  const p = new Proxy(
    {},
    {
      get: (_, prop) => {
        function get(_, prop1) {
          console.log('get', prop1)
          return proxy
        }
        function apply(_, __, args) {
          console.log('apply', __, args)
          return '123'
        }
        const proxy = new Proxy(() => {}, { get, apply })
        return proxy
      },
    },
  )

  console.log(p.a.b.c())

  const save = () => {
    saved.value = true
  }
  return () => (
    <div>
      <input
        type="text"
        class="border border-solid rounded h-8 w-50"
        v-model={inputValue.value}
        onInput={e => {
          saved.value = false
          inputValue.value = (e.target as HTMLInputElement).value
        }}
      />
      <button onClick={save}>save</button>
      {saved.value && <div>saved</div>}
    </div>
  )
})

export default Article1Page
