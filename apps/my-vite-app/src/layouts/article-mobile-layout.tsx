import { defineComponent } from 'vue'
import type { Component } from 'vue'
import { RouterView } from 'vue-router'

type RouterViewSlot = {
  Component: Component
}

export const ArticleLayout = defineComponent({
  name: 'ArticleMobileLayout',
  setup() {
    return () => (
      <div>
        mobile
        <RouterView name="top">
          {{
            default: ({ Component }: RouterViewSlot) => (Component ? Component : null),
          }}
        </RouterView>
        <RouterView name="main">
          {{
            default: ({ Component }: RouterViewSlot) => (Component ? Component : null),
          }}
        </RouterView>
      </div>
    )
  },
})

export default ArticleLayout
