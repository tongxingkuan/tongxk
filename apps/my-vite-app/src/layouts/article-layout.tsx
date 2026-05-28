import { defineComponent } from 'vue'
import { ref, watch } from 'vue'
import { RouterView, useRouter } from 'vue-router'

export const ArticleLayout = defineComponent({
  name: 'ArticleLayout',
  setup() {
    const router = useRouter()
    const currentTitle = ref<string>('文章')

    watch(
      router.currentRoute,
      () => {
        currentTitle.value = (router.currentRoute.value.meta?.title as string) || '文章'
      },
      {
        immediate: true,
      },
    )

    return () => (
      <div class="h-screen w-screen overflow-auto">
        <div class="p-4">
          <h1>{currentTitle.value}</h1>
          <RouterView />
        </div>
      </div>
    )
  },
})

export default ArticleLayout
