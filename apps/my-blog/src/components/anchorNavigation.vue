<template>
  <ul class="navigation" :class="{ 'is-root': depth === 0 }">
    <li
      v-for="(item, index) in navigationTree"
      :key="item.id || index"
      :title="item.text"
      :data-anchor-id="item.id"
      :class="[
        'nav-item',
        `depth-${depth}`,
        {
          'active-hash': currentHash === '#' + item.id,
          'active-ancestor': hasActiveDescendant(item),
        },
      ]"
    >
      <a
        :href="'#' + item.id"
        class="nav-link"
        :style="{ top: depth * 28 + 'px', zIndex: 30 - depth }"
        @click="onLinkClick(item.id)"
      >
        <span class="nav-text">{{ item.text }}</span>
      </a>
      <anchorNavigation
        v-if="item.children"
        :navigation-tree="item.children"
        :depth="depth + 1"
        class="subnavigation"
      />
    </li>
  </ul>
</template>

<script setup>
const props = defineProps({
  navigationTree: {
    type: Array,
    default: () => [],
  },
  depth: {
    type: Number,
    default: 0,
  },
})

const route = useRoute()
const currentHash = ref(route.hash)

// 递归判断某节点的子孙里是否包含当前选中项（用于祖先高亮）
const hasActiveDescendant = item => {
  if (!item.children || !currentHash.value) return false
  const targetId = currentHash.value.slice(1)
  const walk = list => list.some(n => n.id === targetId || (n.children && walk(n.children)))
  return walk(item.children)
}

// 扁平化导航树拿到所有 id，供滚动联动查找
const flattenIds = list => {
  const ids = []
  const walk = arr => {
    arr.forEach(n => {
      if (n.id) ids.push(n.id)
      if (n.children) walk(n.children)
    })
  }
  walk(list)
  return ids
}

// 把激活项滚动到 anchor 侧边栏可视区中央
// 用 rAF 双层等待保证 DOM 更新完成后再计算位置，避免被同步布局抖动影响
const scrollActiveIntoView = targetId => {
  if (props.depth !== 0) return
  const id = targetId || (currentHash.value || '').slice(1)
  if (!id) return
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const container = document.querySelector('.anchor-aside')
      if (!container) return
      const el = container.querySelector(`[data-anchor-id="${CSS.escape(id)}"] > .nav-link`)
      if (!el) return
      const cRect = container.getBoundingClientRect()
      const eRect = el.getBoundingClientRect()
      const visible = eRect.top >= cRect.top + 4 && eRect.bottom <= cRect.bottom - 4
      if (visible) return
      // 用容器 scrollTop 手动定位，避免 scrollIntoView 影响到外层 main 的滚动
      const offset = eRect.top - cRect.top - container.clientHeight / 2 + el.clientHeight / 2
      container.scrollTo({ top: container.scrollTop + offset, behavior: 'smooth' })
    })
  })
}

// 点击同一个 hash 时 route.hash 不变，watch 不会触发，这里兜底处理
const onLinkClick = id => {
  if (props.depth !== 0) return
  suppressScrollSync()
  // 延迟到路由更新后执行；同 hash 点击则立即执行
  nextTick(() => scrollActiveIntoView(id))
}

watch(
  () => route.hash,
  h => {
    currentHash.value = h
    scrollActiveIntoView()
  }
)

// 滚动联动：监听主内容滚动，根据当前位置更新选中态
let scrollContainer = null
let ticking = false
let isSyncingFromClick = false

const computeActiveId = () => {
  if (props.depth !== 0 || !scrollContainer) return
  const ids = flattenIds(props.navigationTree)
  if (!ids.length) return
  const cRect = scrollContainer.getBoundingClientRect()
  // 触发线：容器顶部下方 80px，标题越过该线即视为进入
  const threshold = cRect.top + 80
  let activeId = ids[0]
  for (const id of ids) {
    const el = document.getElementById(id)
    if (!el) continue
    const top = el.getBoundingClientRect().top
    if (top <= threshold) {
      activeId = id
    } else {
      break
    }
  }
  // 滚到底部时强制选中最后一个
  if (scrollContainer.scrollTop + scrollContainer.clientHeight >= scrollContainer.scrollHeight - 2) {
    activeId = ids[ids.length - 1]
  }
  const newHash = '#' + activeId
  if (newHash !== currentHash.value) {
    currentHash.value = newHash
    // 同步 URL 但不触发滚动
    if (history.replaceState) {
      history.replaceState(null, '', route.path + newHash)
    }
    scrollActiveIntoView(activeId)
  }
}

const onScroll = () => {
  if (isSyncingFromClick) return
  if (ticking) return
  ticking = true
  requestAnimationFrame(() => {
    computeActiveId()
    ticking = false
  })
}

// 点击后短时间内屏蔽滚动联动，避免平滑滚动过程中高亮乱跳
const suppressScrollSync = () => {
  isSyncingFromClick = true
  clearTimeout(suppressScrollSync._t)
  suppressScrollSync._t = setTimeout(() => {
    isSyncingFromClick = false
  }, 800)
}

onMounted(() => {
  scrollActiveIntoView()
  if (props.depth !== 0) return
  scrollContainer = document.querySelector('.articles')
  if (scrollContainer) {
    scrollContainer.addEventListener('scroll', onScroll, { passive: true })
    // 初次计算
    nextTick(() => computeActiveId())
  }
})

onBeforeUnmount(() => {
  if (scrollContainer) {
    scrollContainer.removeEventListener('scroll', onScroll)
  }
})
</script>

<style lang="less" scoped>
.navigation {
  list-style: none;
  padding: 0;
  margin: 0;
}

.nav-item {
  margin-bottom: 1px;

  > .nav-link {
    // 关键：sticky 让祖先节点在滚动子孙时停留在顶部
    position: sticky;
    display: block;
    padding: 5px 8px;
    text-decoration: none;
    color: #777;
    font-size: 12px;
    border-radius: 4px;
    transition:
      background 0.2s ease,
      color 0.2s ease,
      border-color 0.2s ease;
    border-left: 2px solid transparent;
    // sticky 元素需要不透明背景，避免底下内容透出
    background: #fff;

    .nav-text {
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &:hover {
      background-color: #fff;
      background-image: linear-gradient(90deg, rgba(23, 133, 207, 0.1) 0%, rgba(23, 133, 207, 0.04) 100%);
      color: #1785cf;
      border-left-color: rgba(23, 133, 207, 0.3);
    }
  }

  // 祖先节点（含直接父级 = 倒数第二级）：子孙里有激活项时轻微高亮，sticky 置顶时不随滚动消失
  &.active-ancestor {
    > .nav-link {
      color: #1785cf;
      // 白底兜底，避免置顶时透出下方滚动内容
      background-color: #fff;
      background-image: linear-gradient(90deg, rgba(23, 133, 207, 0.06) 0%, rgba(23, 133, 207, 0.02) 100%);
      border-left-color: rgba(23, 133, 207, 0.5);
      box-shadow: 0 1px 0 rgba(23, 133, 207, 0.1);
    }
  }

  // 当前命中节点：强高亮
  // 注意：sticky 置顶时必须保持不透明背景，否则会透出下方滚动内容
  &.active-hash {
    > .nav-link {
      // 先铺一层纯白底，再叠加半透明蓝色，视觉效果等同于渐变但完全不透明
      background-color: #fff;
      background-image: linear-gradient(90deg, rgba(23, 133, 207, 0.14) 0%, rgba(23, 133, 207, 0.04) 100%);
      color: #1785cf;
      font-weight: 500;
      border-left-color: #1785cf;
    }
  }
}

.subnavigation {
  padding-left: 8px;
  margin-top: 1px;
}

@media (max-width: 1024px) {
  .nav-item {
    > .nav-link {
      padding: 4px 6px;
      font-size: 11px;
    }
  }

  .subnavigation {
    padding-left: 6px;
  }
}
</style>
