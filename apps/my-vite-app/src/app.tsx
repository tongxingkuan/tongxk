import { defineComponent } from 'vue'
import { NMessageProvider } from 'naive-ui'
import { RouterView } from 'vue-router'

export const App = defineComponent({
  name: 'App',
  setup() {
    return () => (
      <NMessageProvider>
        <RouterView />
      </NMessageProvider>
    )
  },
})

export default App
