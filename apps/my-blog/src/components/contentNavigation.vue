<template>
  <div class="content-navigation">
    <div class="nav-header">
      <span class="nav-title">{{ collapsed ? '' : sidebarTitle }}</span>
      <button class="collapse-btn" @click="toggleCollapse" :title="collapsed ? '展开侧边栏' : '收起侧边栏'">
        <n-icon :component="collapsed ? ChevronForward : ChevronBack" :size="14" />
      </button>
    </div>
    <!-- 展开状态菜单 -->
    <div v-show="!collapsed" class="menu-wrapper">
      <!-- 统一显示分类层级结构 -->
      <template v-for="item in navigationTree" :key="item._path">
        <div class="menu-category">
          <div
            class="category-header"
            :class="{ expanded: expandedKeys.includes(item._path) || isSingleCategory }"
            @click="toggleCategory(item._path)"
          >
            <n-icon :component="getCategoryIcon(item.title)" :size="18" />
            <span class="category-title">{{ getCategoryTitle(item.title) }}</span>
            <span v-if="item.children?.length" class="category-count">{{ item.children.length }}</span>
            <n-icon
              v-if="!isSingleCategory"
              :component="expandedKeys.includes(item._path) ? ChevronUp : ChevronDown"
              :size="14"
              class="category-arrow"
            />
          </div>
          <div
            v-show="expandedKeys.includes(item._path) || isSingleCategory"
            class="category-children"
            :class="{ 'no-padding': isSingleCategory }"
          >
            <NuxtLink
              v-for="child in (isSingleCategory ? flatItems : item.children)"
              :key="child._path"
              :to="child._path"
              class="menu-item"
              :class="{ active: isActive(child._path) }"
            >
              <span class="menu-item-dot"></span>
              <span class="menu-item-title">{{ child.title }}</span>
            </NuxtLink>
          </div>
        </div>
      </template>
    </div>
    <!-- 收起状态菜单 -->
    <div v-show="collapsed" class="collapsed-menu">
      <template v-if="isSingleCategory && flatItems.length > 0">
        <!-- 单分类模式：只显示一个图标，点击弹出所有子项 -->
        <n-dropdown
          :options="flatItems.map(item => ({
            label: () =>
              h(
                RouterLink,
                { to: item._path, class: { active: isActive(item._path) } },
                { default: () => item.title }
              ),
            key: item._path,
          }))"
          trigger="hover"
          placement="right"
        >
          <div class="collapsed-item">
            <n-icon :component="getCategoryIcon(navigationTree[0]?.title)" :size="20" />
          </div>
        </n-dropdown>
      </template>
      <template v-else>
        <template v-for="item in navigationTree" :key="item._path">
          <n-dropdown
            v-if="item.children?.length"
            :options="
              item.children.map(child => ({
                label: () =>
                  h(
                    RouterLink,
                    { to: child._path, class: { active: isActive(child._path) } },
                    { default: () => child.title }
                  ),
                key: child._path,
              }))
            "
            trigger="hover"
            placement="right"
          >
            <div class="collapsed-item">
              <n-icon :component="getCategoryIcon(item.title)" :size="20" />
            </div>
          </n-dropdown>
          <NuxtLink v-else :to="item._path" class="collapsed-item">
            <n-icon :component="getCategoryIcon(item.title)" :size="20" />
          </NuxtLink>
        </template>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  Document as DocumentIcon,
  Albums as QuestionMarkIcon,
  ChevronUp,
  ChevronDown,
  ChevronForward,
  ChevronBack,
  Book as BookIcon,
} from '@vicons/ionicons5'
import { NIcon, NDropdown } from 'naive-ui'
import type { PropType } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { h } from 'vue'

interface NavigationTree {
  title: string
  _path: string
  children?: NavigationTree[]
}
const props = defineProps({
  navigationTree: {
    type: Array as PropType<NavigationTree[]>,
    default: () => [],
  },
  collapsed: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:collapsed'])

const route = useRoute()
const collapsed = ref(props.collapsed)
const expandedKeys = ref<string[]>([])

// 判断是否是单分类模式
const isSingleCategory = computed(() => {
  return props.navigationTree.length === 1 && props.navigationTree[0]?.children?.length > 0
})

// 获取扁平的子菜单列表
const flatItems = computed(() => {
  if (props.navigationTree.length === 1) {
    return props.navigationTree[0]?.children || []
  }
  return []
})

// 获取侧边栏标题
const sidebarTitle = computed(() => {
  if (props.navigationTree.length === 1) {
    const title = props.navigationTree[0]?.title
    if (title === 'Articles' || title === '文章') return '文章列表'
    if (title === 'Questions' || title === '面试题') return '面试题列表'
  }
  return '文章导航'
})

// 从 localStorage 读取状态
const STORAGE_KEY = 'my-blog-sidebar-state'

const loadState = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const state = JSON.parse(saved)
      collapsed.value = state.collapsed ?? false
      expandedKeys.value = state.expandedKeys ?? []
    }
  } catch (e) {
    console.warn('Failed to load sidebar state:', e)
  }
}

// 保存状态到 localStorage
const saveState = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      collapsed: collapsed.value,
      expandedKeys: expandedKeys.value,
    }))
  } catch (e) {
    console.warn('Failed to save sidebar state:', e)
  }
}

// 切换展开/收起
const toggleCollapse = () => {
  collapsed.value = !collapsed.value
  emit('update:collapsed', collapsed.value)
  saveState()
}

onMounted(() => {
  loadState()

  // 默认展开所有分类（如果没有保存的状态）
  if (expandedKeys.value.length === 0) {
    props.navigationTree.forEach(item => {
      if (item.children?.length) {
        expandedKeys.value.push(item._path)
      }
    })
  }
})

const getCategoryIcon = (title: string) => {
  if (title === 'Articles' || title === '文章') return DocumentIcon
  if (title === 'Questions' || title === '面试题') return QuestionMarkIcon
  return BookIcon
}

const getCategoryTitle = (title: string) => {
  if (title === 'Articles' || title === '文章') return '文章列表'
  if (title === 'Questions' || title === '面试题') return '面试题列表'
  return title
}

const toggleCategory = (key: string) => {
  const index = expandedKeys.value.indexOf(key)
  if (index > -1) {
    expandedKeys.value.splice(index, 1)
  } else {
    expandedKeys.value.push(key)
  }
  saveState()
}

const isActive = (path: string) => {
  return route.path === path || route.path.startsWith(path + '/')
}
</script>

<style lang="less" scoped>
.content-navigation {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
}

.nav-header {
  padding: 16px;
  border-bottom: 1px solid rgba(23, 133, 207, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, rgba(23, 133, 207, 0.03) 0%, rgba(64, 158, 255, 0.03) 100%);

  .nav-title {
    font-size: 15px;
    font-weight: 600;
    color: #1785cf;
    letter-spacing: 0.5px;
  }

  .collapse-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: none;
    background: #fff;
    border-radius: 8px;
    cursor: pointer;
    color: #666;
    transition: all 0.2s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

    &:hover {
      background: #1785cf;
      color: #fff;
      box-shadow: 0 4px 12px rgba(23, 133, 207, 0.25);
      transform: scale(1.05);
    }
  }
}

.menu-wrapper {
  padding: 8px;
  height: 100%;
  overflow-y: auto;
}

.menu-category {
  margin-bottom: 8px;

  .category-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.25s ease;
    color: #555;
    background: transparent;
    margin-bottom: 4px;

    &:hover {
      background: linear-gradient(135deg, rgba(23, 133, 207, 0.08) 0%, rgba(64, 158, 255, 0.08) 100%);
      color: #1785cf;
      transform: translateX(4px);
    }

    &.expanded {
      background: linear-gradient(135deg, rgba(23, 133, 207, 0.12) 0%, rgba(64, 158, 255, 0.12) 100%);
      color: #1785cf;
      font-weight: 600;

      .category-arrow {
        color: #1785cf;
      }
    }

    .category-title {
      flex: 1;
      font-size: 14px;
      font-weight: 500;
    }

    .category-count {
      font-size: 11px;
      color: #fff;
      background: linear-gradient(135deg, #1785cf 0%, #409eff 100%);
      padding: 2px 8px;
      border-radius: 12px;
      font-weight: 500;
    }

    .category-arrow {
      color: #aaa;
      transition: transform 0.3s ease;
    }
  }

  .category-children {
    padding-left: 12px;
    animation: slideDown 0.25s ease;
    border-left: 2px solid rgba(23, 133, 207, 0.1);
    margin-left: 14px;

    &.no-padding {
      padding-left: 0;
      border-left: none;
      margin-left: 0;
    }
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 8px;
  text-decoration: none;
  color: #666;
  font-size: 13px;
  transition: all 0.25s ease;
  margin-bottom: 4px;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 0;
    background: linear-gradient(180deg, #1785cf 0%, #409eff 100%);
    border-radius: 0 2px 2px 0;
    transition: all 0.25s ease;
  }

  .menu-item-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #ccc;
    transition: all 0.25s ease;
    flex-shrink: 0;
  }

  .menu-item-title {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &:hover {
    background: linear-gradient(135deg, rgba(23, 133, 207, 0.06) 0%, rgba(64, 158, 255, 0.06) 100%);
    color: #1785cf;
    transform: translateX(6px);

    .menu-item-dot {
      background: #1785cf;
      transform: scale(1.3);
    }
  }

  &.active {
    background: linear-gradient(135deg, rgba(23, 133, 207, 0.12) 0%, rgba(64, 158, 255, 0.12) 100%);
    color: #1785cf;
    font-weight: 600;
    transform: translateX(6px);

    &::before {
      height: 60%;
    }

    .menu-item-dot {
      background: #1785cf;
      width: 8px;
      height: 8px;
      box-shadow: 0 0 8px rgba(23, 133, 207, 0.5);
    }
  }
}

// 收起状态
.collapsed-menu {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px 8px;
  overflow-y: auto;

  .collapsed-item {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: 12px;
    cursor: pointer;
    color: #888;
    text-decoration: none;
    transition: all 0.25s ease;
    position: relative;

    &:hover {
      background: linear-gradient(135deg, rgba(23, 133, 207, 0.15) 0%, rgba(64, 158, 255, 0.15) 100%);
      color: #1785cf;
      transform: scale(1.1);
      box-shadow: 0 4px 12px rgba(23, 133, 207, 0.2);
    }

    :deep(.active) {
      background: linear-gradient(135deg, #1785cf 0%, #409eff 100%);
      color: #fff;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(23, 133, 207, 0.3);
    }
  }

  .collapsed-dropdown-title {
    font-weight: 600;
    font-size: 13px;
    padding: 8px 12px;
    border-bottom: 1px solid #f0f0f0;
  }
}
</style>
