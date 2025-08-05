import { createComponent } from 'shared'
import { RouterView, useRoute } from 'vue-router'

export const MobileLayout = createComponent(null, () => {
  const route = useRoute()
  if (route.meta.title) {
    document.title = route.meta.title
  }
  return () => (
    <div class="max-w-[var(--phone-page-max-width)] w-full mx-auto">
      <RouterView />
    </div>
  )
})

export default MobileLayout
