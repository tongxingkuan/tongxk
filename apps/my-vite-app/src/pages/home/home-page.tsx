import { defineComponent } from 'vue'
import { RouterLink } from 'vue-router'

export const HomePage = defineComponent({
  name: 'HomePage',
  setup() {
    return () => (
      <div>
        <div>接着博客的搭建，边学边完善吧～</div>
        <div>
          <RouterLink to="/article">文章</RouterLink>
        </div>
      </div>
    )
  },
})

export default HomePage
