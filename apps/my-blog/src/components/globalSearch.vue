<script setup lang="ts">
import type { QueryBuilderParams } from '@nuxt/content'
import { onMounted, onUnmounted } from 'vue'

const queryStr = ref<string>('')
const showDropdown = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)
const selectedIndex = ref(-1)
const searchResults = ref<any[]>([])

// 热门搜索
const hotSearches = [
  { title: 'Vue3 响应式原理', query: 'Vue3' },
  { title: 'TypeScript 入门', query: 'TypeScript' },
  { title: '前端性能优化', query: '性能优化' },
]

const query = computed<QueryBuilderParams>(() => ({
  path: '/',
  where: [{ querys: { $contains: queryStr.value.toLocaleLowerCase() } }],
}))

// 键盘快捷键
const handleKeydown = (e: KeyboardEvent) => {
  // Ctrl+K 或 Cmd+K 打开搜索
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault()
    inputRef.value?.focus()
    showDropdown.value = true
  }

  // ESC 关闭搜索
  if (e.key === 'Escape') {
    showDropdown.value = false
    queryStr.value = ''
    inputRef.value?.blur()
  }

  // 上下键导航
  if (showDropdown.value) {
    const totalItems = searchResults.value.length + (queryStr.value ? 0 : hotSearches.length)
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      selectedIndex.value = (selectedIndex.value + 1) % totalItems
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      selectedIndex.value = selectedIndex.value <= 0 ? totalItems - 1 : selectedIndex.value - 1
    } else if (e.key === 'Enter' && selectedIndex.value >= 0) {
      e.preventDefault()
      if (selectedIndex.value < searchResults.value.length) {
        // 点击搜索结果
        navigateTo(searchResults.value[selectedIndex.value]._path)
      } else {
        // 点击热门搜索
        const hotIndex = selectedIndex.value - searchResults.value.length
        if (hotSearches[hotIndex]) {
          queryStr.value = hotSearches[hotIndex].query
        }
      }
    }
  }
}

const handleFocus = () => {
  if (queryStr.value.trim()) {
    showDropdown.value = true
  }
}

const handleBlur = () => {
  setTimeout(() => {
    showDropdown.value = false
    selectedIndex.value = -1
  }, 200)
}

const handleInput = () => {
  showDropdown.value = queryStr.value.trim().length > 0
  selectedIndex.value = -1
}

const handleHotSearch = (query: string) => {
  queryStr.value = query
  showDropdown.value = true
}

const router = useRouter()

const navigateTo = (path: string) => {
  router.push(path)
  showDropdown.value = false
  queryStr.value = ''
  selectedIndex.value = -1
}

const highlightText = (text: string | undefined, query: string) => {
  if (!text || !query) return text
  const regex = new RegExp(`(${query})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}

// 全局点击关闭
const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (!target.closest('.global-search-wrapper')) {
    showDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('click', handleClickOutside)
})

// 更新搜索结果
const updateResults = (list: any[]) => {
  searchResults.value = list
}
</script>

<template>
  <div class="global-search-wrapper">
    <div class="search-input-wrap" :class="{ active: showDropdown }">
      <span class="search-icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      </span>
      <input
        ref="inputRef"
        v-model="queryStr"
        placeholder="搜索文章..."
        class="search-input"
        @focus="handleFocus"
        @blur="handleBlur"
        @input="handleInput"
      />
      <span class="search-shortcut"> <kbd>⌘</kbd><kbd>K</kbd> </span>
    </div>
    <ContentList v-if="showDropdown" :query="query" @update:list="updateResults">
      <template #default="{ list }">
        <div class="search-dropdown">
          <!-- 搜索结果 -->
          <template v-if="queryStr.trim()">
            <div v-if="list.length > 0" class="result-section">
              <div class="section-title">
                <span class="title-icon">📄</span>
                搜索结果
                <span class="result-count">{{ list.length }}</span>
              </div>
              <ul class="search-list">
                <li
                  v-for="(article, index) in list"
                  :key="article._path"
                  class="search-item"
                  :class="{ selected: selectedIndex === index }"
                  @click="navigateTo(article._path)"
                  @mouseenter="selectedIndex = index"
                >
                  <div class="article-title" v-html="highlightText(article.title, queryStr)"></div>
                  <div class="article-desc" v-html="highlightText(article.description, queryStr)"></div>
                </li>
              </ul>
            </div>
            <div v-else class="no-result">
              <span class="no-result-icon">🔍</span>
              <span>未找到 "{{ queryStr }}" 相关结果</span>
            </div>
          </template>
          <!-- 热门搜索 -->
          <template v-else>
            <div class="hot-search-section">
              <div class="section-title">
                <span class="title-icon">🔥</span>
                热门搜索
              </div>
              <ul class="hot-list">
                <li
                  v-for="(hot, index) in hotSearches"
                  :key="hot.query"
                  class="hot-item"
                  :class="{ selected: selectedIndex === list.length + index }"
                  @click="handleHotSearch(hot.query)"
                  @mouseenter="selectedIndex = list.length + index"
                >
                  <span class="hot-icon">{{ index + 1 }}</span>
                  <span class="hot-title">{{ hot.title }}</span>
                </li>
              </ul>
            </div>
          </template>
          <div class="search-footer">
            <span class="footer-hint"> <kbd>↑</kbd><kbd>↓</kbd> 导航 </span>
            <span class="footer-hint"> <kbd>↵</kbd> 确认 </span>
            <span class="footer-hint"> <kbd>esc</kbd> 关闭 </span>
          </div>
        </div>
      </template>
      <template #not-found>
        <div class="search-dropdown">
          <div class="no-result">
            <span class="no-result-icon">🔍</span>
            <span>未找到相关结果</span>
          </div>
        </div>
      </template>
    </ContentList>
  </div>
</template>

<style lang="less" scoped>
.global-search-wrapper {
  position: relative;
  width: 100%;
  max-width: 360px;
}

.search-input-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.18);
  }

  &.active,
  &:focus-within {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.3);
    box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.1);
  }

  .search-icon {
    display: flex;
    align-items: center;
    color: rgba(255, 255, 255, 0.7);
  }

  .search-input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    color: #fff;
    font-size: 14px;

    &::placeholder {
      color: rgba(255, 255, 255, 0.5);
    }
  }

  .search-shortcut {
    display: flex;
    gap: 3px;

    kbd {
      padding: 2px 6px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 4px;
      font-size: 11px;
      color: rgba(255, 255, 255, 0.5);
      font-family: inherit;
    }
  }
}

.search-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.12);
  max-height: 420px;
  overflow: hidden;
  z-index: 100;
  animation: dropdownFade 0.2s ease;
}

@keyframes dropdownFade {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px 10px;
  font-size: 12px;
  font-weight: 600;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  .title-icon {
    font-size: 14px;
  }

  .result-count {
    margin-left: auto;
    background: #f0f5ff;
    color: #1785cf;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 11px;
  }
}

.search-list,
.hot-list {
  list-style: none;
  padding: 4px 8px 8px;
  margin: 0;
}

.search-item,
.hot-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover,
  &.selected {
    background: #f5f7fa;
  }

  &.selected {
    background: #e8f4ff;
  }
}

.search-item {
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;

  .article-title {
    font-size: 14px;
    font-weight: 500;
    color: #333;
    width: 100%;

    :deep(mark) {
      background: #fef08a;
      color: #333;
      padding: 0 2px;
      border-radius: 2px;
    }
  }

  .article-desc {
    font-size: 12px;
    color: #999;
    width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    :deep(mark) {
      background: #fef08a;
      color: #333;
      padding: 0 2px;
      border-radius: 2px;
    }
  }
}

.hot-item {
  .hot-icon {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
    font-size: 12px;
    font-weight: 600;
    border-radius: 8px;
  }

  .hot-title {
    font-size: 14px;
    color: #333;
  }
}

.no-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px;
  color: #999;
  font-size: 14px;

  .no-result-icon {
    font-size: 32px;
    opacity: 0.5;
  }
}

.search-footer {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 12px;
  border-top: 1px solid #f0f0f0;
  background: #fafafa;

  .footer-hint {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: #999;

    kbd {
      padding: 2px 5px;
      background: #fff;
      border: 1px solid #e5e5e5;
      border-radius: 4px;
      font-size: 10px;
      color: #666;
    }
  }
}

// 移动端适配
@media (max-width: 768px) {
  .global-search-wrapper {
    display: none;
  }
}
</style>
