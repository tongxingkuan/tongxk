import { createComponent } from 'shared'

export const HomePage = createComponent(null, () => {
  return () => (
    <div>
      <div>接着博客的搭建，边学边完善吧～</div>
      <div>
        <a href="/article">文章</a>
      </div>
    </div>
  )
})

export default HomePage
