<template>
  <client-only>
    <div class="w-screen h-screen flex flex-col overflow-hidden">
      <header class="site-header">
        <div class="header-left">
          <NuxtLink to="/" class="logo">
            <img src="/icon.webp" class="logo-icon" alt="logo" />
            <span class="logo-text">童话的博客</span>
          </NuxtLink>
        </div>
        <div class="header-center">
          <globalSearch />
        </div>
        <div class="header-right">
          <nav class="main-nav">
            <NuxtLink to="/articles" class="nav-link" active-class="active">文章</NuxtLink>
            <NuxtLink to="/demos" class="nav-link" active-class="active">演示</NuxtLink>
            <NuxtLink to="/questions" class="nav-link" active-class="active">面试题</NuxtLink>
          </nav>
        </div>
      </header>
      <nav class="breadcrumb-nav">
        <div class="breadcrumb-content">
          <RouterLink to="/" class="breadcrumb-home">首页</RouterLink>
          <span class="breadcrumb-sep">/</span>
          <span v-if="isArticlesRoute" class="breadcrumb-current">文章</span>
          <span v-else-if="isQuestionsRoute" class="breadcrumb-current">面试题</span>
          <template v-if="route.params.slug?.[0]">
            <span class="breadcrumb-sep">/</span>
            <span class="breadcrumb-current">{{ route.params.slug[0] }}</span>
          </template>
        </div>
      </nav>
      <div class="main-content">
        <aside
          v-if="showSidebar"
          class="sidebar"
          :class="{ collapsed: sidebarCollapsed, 'mobile-open': mobileMenuOpen }"
        >
          <contentNavigation
            class="sidebar-nav"
            @update:collapsed="handleCollapsed"
            :navigation-tree="sidebarNavigation"
            :collapsed="sidebarCollapsed"
          ></contentNavigation>
        </aside>
        <!-- 移动端遮罩层 -->
        <div v-if="showSidebar && mobileMenuOpen" class="sidebar-overlay" @click="closeMobileMenu"></div>
        <!-- 移动端侧边栏切换按钮 -->
        <button
          v-if="showSidebar"
          class="mobile-menu-btn"
          @click="toggleMobileMenu"
          :class="{ 'menu-open': mobileMenuOpen }"
        >
          <n-icon :component="mobileMenuOpen ? Close : Menu" :size="20" />
        </button>
        <main class="w-full h-full overflow-y-auto articles transition-all duration-200">
          <slot></slot>
        </main>
        <aside v-if="showAnchor" class="md:!block !hidden w-[200px] shrink-0 h-full overflow-y-auto">
          <anchorNavigation :navigation-tree="aNavigation"></anchorNavigation>
        </aside>
      </div>
      <footer class="footer">
        <span class="footer-text">© 2024 童话的博客 · 技术分享 · 实战演示</span>
      </footer>
    </div>
  </client-only>
</template>
<script setup lang="ts">
import type { TocLink } from '@nuxt/content'
import { RouterLink } from 'vue-router'
import { Menu, Close } from '@vicons/ionicons5'
import { NIcon } from 'naive-ui'

interface NavigationItem {
  title: string
  _path: string
  children?: NavigationItem[]
}

const sidebarCollapsed = ref(false)
const mobileMenuOpen = ref(false)

// 切换移动端菜单
const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

// 关闭移动端菜单
const closeMobileMenu = () => {
  mobileMenuOpen.value = false
}

// 监听路由变化关闭移动端菜单
watch(
  () => route.path,
  () => {
    closeMobileMenu()
  }
)

// 从 localStorage 读取侧边栏状态
const STORAGE_KEY = 'my-blog-sidebar-state'

const loadSidebarState = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const state = JSON.parse(saved)
      sidebarCollapsed.value = state.collapsed ?? false
    }
  } catch (e) {
    console.warn('Failed to load sidebar state:', e)
  }
}

const handleCollapsed = (_collapsed: boolean) => {
  sidebarCollapsed.value = _collapsed
  // 保存状态到 localStorage
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    const state = saved ? JSON.parse(saved) : { expandedKeys: [] }
    state.collapsed = _collapsed
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (e) {
    console.warn('Failed to save sidebar state:', e)
  }
}

onMounted(() => {
  loadSidebarState()
})

const route = useRoute()

const aNavigation = ref<TocLink[]>([])

// 判断当前路由类型
const isArticlesRoute = computed(() => route.path.includes('/articles'))
const isQuestionsRoute = computed(() => route.path.includes('/questions'))

// 判断是否显示侧边栏（一级路由下不显示）
const showSidebar = computed(() => {
  // 一级路由 /articles、/questions 等不显示侧边栏
  if (route.path === '/articles' || route.path === '/questions') {
    return false
  }
  // 子路由下显示侧边栏
  return isArticlesRoute.value || isQuestionsRoute.value
})

// 判断是否显示锚点导航
const showAnchor = computed(() => route.params.slug && route.params.slug.length > 0)

// 根据路由获取对应的侧边栏导航
const sidebarNavigation = computed<NavigationItem[]>(() => {
  if (isArticlesRoute.value) {
    // 文章路由下只显示Articles
    return cNavigation.value?.filter(item => item.title === 'Articles' || item.title === '文章') || []
  } else if (isQuestionsRoute.value) {
    // 面试题路由下只显示Questions
    return cNavigation.value?.filter(item => item.title === 'Questions' || item.title === '面试题') || []
  }
  return []
})

// fetchContentNavigation 根据content目录结构生成路由，用queryContent限定想要的目录
const { data: cNavigation } = await useAsyncData('cNavigation', () => {
  return fetchContentNavigation(queryContent(''))
})

// 监听articles/questions子路由变化，并根据路由名找到对应的文章对象，body.toc.links是content生成，包含了markdown文档的锚点导航，depth参见配置项nuxt.config.ts。
if (route.params.slug && route.params.slug.length > 0) {
  const content = await queryContent(
    route.path.includes('questions')
      ? 'questions/' + route.params.slug[0]
      : route.path.includes('articles')
        ? 'articles/' + route.params.slug[0]
        : ''
  ).find()
  if (content && content.length > 0) {
    aNavigation.value = content?.[0]?.body?.toc?.links || []
  } else {
    aNavigation.value = []
  }
}

watch(route, async ({ params }) => {
  aNavigation.value = []
  // 访问pages/index不会有slug，所以判断
  if (params.slug) {
    // 查询articles/questions目录下md文件中用"---"包裹的文件说明，其中route说明等于当前路由slug
    const content = await queryContent(
      route.path.includes('questions')
        ? 'questions/' + route.params.slug[0]
        : route.path.includes('articles')
          ? 'articles/' + route.params.slug[0]
          : ''
    ).find()
    if (content && content.length > 0) {
      aNavigation.value = content?.[0]?.body?.toc?.links || []
    }
  }
})

// 监听路由变化更新侧边栏
watch(route, () => {
  // 侧边栏导航会在computed中自动更新
})
</script>
<style lang="less" scoped>
.site-header {
  height: 56px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: linear-gradient(135deg, #1785cf 0%, #409eff 100%);
  box-shadow: 0 2px 12px rgba(23, 133, 207, 0.15);
  flex-shrink: 0;

  .header-left {
    flex: 1;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
    color: #fff;

    .logo-icon {
      width: 28px;
      height: 28px;
      object-fit: contain;
    }

    .logo-text {
      font-size: 18px;
      font-weight: 600;
      letter-spacing: 1px;
    }
  }

  .header-center {
    flex: 2;
    display: flex;
    justify-content: center;
    max-width: 500px;
  }

  .header-right {
    flex: 1;
    display: flex;
    justify-content: flex-end;
  }

  .main-nav {
    display: flex;
    gap: 8px;
  }

  .nav-link {
    padding: 8px 20px;
    color: rgba(255, 255, 255, 0.85);
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
    border-radius: 8px;
    transition: all 0.3s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.15);
      color: #fff;
    }

    &.active {
      background: rgba(255, 255, 255, 0.25);
      color: #fff;
    }
  }
}

.breadcrumb-nav {
  height: 40px;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  background: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;

  .breadcrumb-content {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
  }

  .breadcrumb-home {
    color: #666;
    text-decoration: none;

    &:hover {
      color: #1785cf;
    }
  }

  .breadcrumb-sep {
    color: #ccc;
  }

  .dropdown-trigger {
    font-size: 13px;
    color: #666;
    cursor: pointer;

    &:hover {
      color: #1785cf;
    }
  }

  .breadcrumb-current {
    color: #333;
    font-weight: 500;
  }
}

.main-content {
  display: flex;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.sidebar {
  width: 260px;
  height: 100%;
  overflow: hidden;
  transition: width 0.3s ease;
  flex-shrink: 0;

  &.collapsed {
    width: 64px;
  }
}

.sidebar-nav {
  height: 100%;
}

.footer {
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border-top: 1px solid #e5e7eb;
  flex-shrink: 0;

  .footer-text {
    font-size: 13px;
    color: #999;
  }
}

:global(.el-scrollbar__bar.is-horizontal) {
  display: none;
}

@media (max-width: 768px) {
  .site-header {
    padding: 0 12px;

    .logo-text {
      display: none;
    }

    .header-center {
      display: none;
    }

    .nav-link {
      padding: 6px 10px;
      font-size: 13px;
    }
  }

  .breadcrumb-nav {
    padding: 0 12px;

    .breadcrumb-content {
      font-size: 12px;
      gap: 4px;
    }
  }

  .sidebar {
    position: fixed;
    left: 0;
    top: 96px;
    height: calc(100vh - 132px);
    z-index: 100;
    box-shadow: 2px 0 12px rgba(0, 0, 0, 0.15);
    transform: translateX(-100%);
    transition: transform 0.3s ease;

    &:not(.collapsed) {
      transform: translateX(0);
    }

    &.collapsed {
      transform: translateX(-100%);
    }

    &.mobile-open {
      transform: translateX(0);
    }
  }

  .sidebar-overlay {
    position: fixed;
    top: 96px;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 99;
  }

  .mobile-menu-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    position: fixed;
    bottom: 60px;
    right: 20px;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: linear-gradient(135deg, #1785cf 0%, #409eff 100%);
    color: #fff;
    border: none;
    cursor: pointer;
    box-shadow: 0 4px 16px rgba(23, 133, 207, 0.4);
    z-index: 98;
    transition: all 0.3s ease;

    &:hover {
      transform: scale(1.1);
    }

    &.menu-open {
      background: linear-gradient(135deg, #f56c6c 0%, #e6a23c 100%);
    }
  }

  .main-content {
    padding-left: 0;
  }
}

@media (max-width: 480px) {
  .site-header {
    .nav-link {
      padding: 6px 8px;
      font-size: 12px;
    }
  }

  .breadcrumb-nav {
    .breadcrumb-content {
      font-size: 11px;
    }
  }
}
</style>
