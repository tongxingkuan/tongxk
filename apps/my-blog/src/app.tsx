import { createComponent } from 'shared'
import { RouterView } from 'vue-router'

export const App = createComponent(null, () => {
  return () => <RouterView />
})

export default App
