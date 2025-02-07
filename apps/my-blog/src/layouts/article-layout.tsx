import { createComponent } from 'shared'
import type { Component } from 'vue'
import { RouterView } from 'vue-router'

type RouterViewSlot = {
  Component: Component
}

export const ArticleLayout = createComponent(null, () => {
  return () => (
    <div>
      ArticleLayout
      <RouterView name="top">
        {{
          default: ({ Component }: RouterViewSlot) =>
            Component ? Component : 'top-bar',
        }}
      </RouterView>
      <RouterView name="main">
        {{
          default: ({ Component }: RouterViewSlot) =>
            Component ? Component : 'main-content',
        }}
      </RouterView>
    </div>
  )
})

export default ArticleLayout
