import { createComponent } from 'shared'
import { RouterView, useRoute } from 'vue-router'

export const MainLayout = createComponent(null, () => {
  const route = useRoute()
  if (route.meta.title) {
    document.title = route.meta.title
  }
  return () => (
    <div class="max-w-[var(--phone-page-max-width)] w-full mx-auto">
      MainLayout
      <RouterView />
    </div>
  )
})

export default MainLayout
