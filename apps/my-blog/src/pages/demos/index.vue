<template>
  <Title>演示</Title>
  <div class="demos-container">
    <div class="demos-header">
      <h2 class="section-title">
        <span class="title-icon">🎮</span>
        在线演示
      </h2>
      <p class="section-desc">交互式Demo，展示技术能力</p>
    </div>

    <div class="all-demo-tags">
      <div class="tags-header">
        <span class="tags-title">🏷️ 筛选标签</span>
      </div>
      <div v-if="tagListRef.length > 0" class="tags-list">
        <span
          v-for="item in tagListRef"
          :key="item.tag"
          class="filter-tag"
          :class="{ checked: checkedTags.indexOf(item.tag) > -1 }"
          :style="{ backgroundColor: getColor(item.tag) }"
          @click="changeSelect(item.tag)"
        >
          {{ item.tag }}
          <span class="tag-count">({{ item.count }})</span>
        </span>
      </div>
      <div v-else class="tags-empty">
        <span>暂无标签</span>
      </div>
    </div>

    <div class="demo-content">
      <ul v-if="demosRef.length > 0" class="demo-list">
        <li v-for="demo in demosRef" :key="demo._path || demo.path" class="demo-item">
          <nuxt-link :to="demo.path || demo._path" class="demo-link">
            <div class="demo-image-wrapper">
              <el-image :src="demo.source" class="demo-image" fit="cover" />
              <div class="demo-overlay">
                <span class="view-demo">查看演示</span>
              </div>
            </div>
            <div class="demo-info">
              <span class="demo-name">{{ demo.title || demo.name }}</span>
              <div class="tag-list">
                <span v-for="tag in demo.tags" :key="tag" class="demo-tag" :style="{ backgroundColor: getColor(tag) }">
                  {{ tag }}
                </span>
              </div>
            </div>
          </nuxt-link>
        </li>
      </ul>
      <noData v-else></noData>
    </div>

    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="pageNumRef"
        v-model:page-size="pageSizeRef"
        :page-sizes="[8, 12, 16, 24]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="totalRef"
        @size-change="filterDemos"
        @current-change="filterDemos"
        background
      >
      </el-pagination>
    </div>
  </div>
</template>
<script setup lang="ts">
// 定义结构
declare interface Demo {
  name: string
  path: string
  source: string
  tags: string[]
  title?: string
  description?: string
  _path?: string
}
// 布局
definePageMeta({
  layout: 'demo',
})

const route = useRoute()

// 使用 useAsyncData 获取演示数据，key 包含路由路径以确保路由切换时重新获取
const { data: demosData, refresh } = await useAsyncData(`demos-${route.path}`, async () => {
  const demos = await queryContent('demos')
    .sort({ _file: 1 })
    .find()

  return (demos || []).map(d => ({
    name: d.title || d._path?.split('/').pop() || '',
    path: d.path || d._path || '',
    source: d.source || '',
    tags: Array.isArray(d.tags) ? d.tags : [],
    title: d.title,
    description: d.description,
    _path: d._path
  }))
}, {
  watch: [route]
})

// 分页相关
const demosRef = ref<Demo[]>([])
const pageNumRef = ref(1)
const pageSizeRef = ref(12)
const totalRef = ref(0)
const tagRef = ref('')
const tagListRef = ref<any>([])
const checkedTags = ref<string[]>([])
const allDemosRef = ref<Demo[]>([])

// 筛选演示
const filterDemos = () => {
  let filtered = allDemosRef.value
  if (checkedTags.value.length > 0) {
    filtered = filtered.filter(demo =>
      checkedTags.value.every(tag => demo.tags?.includes(tag))
    )
  }

  // 更新总数
  totalRef.value = filtered.length

  // 分页
  const start = (pageNumRef.value - 1) * pageSizeRef.value
  const end = start + pageSizeRef.value
  demosRef.value = filtered.slice(start, end)
}

// 处理数据加载
const processDemosData = () => {
  if (demosData.value) {
    allDemosRef.value = demosData.value

    // 统计所有标签
    const tagMap = new Map<string, number>()
    allDemosRef.value.forEach(demo => {
      (demo.tags || []).forEach(tag => {
        tagMap.set(tag, (tagMap.get(tag) || 0) + 1)
      })
    })
    tagListRef.value = Array.from(tagMap.entries()).map(([tag, count]) => ({ tag, count }))

    totalRef.value = allDemosRef.value.length

    // 初始化筛选
    filterDemos()
  }
}

// 监听数据变化
watch(demosData, () => {
  processDemosData()
}, { immediate: true })

const tagColorMap = new Map([
  ['vue3', '#67c23a'],
  ['vue2', '#409eff'],
  ['nuxt3', '#e6a23c'],
  ['js', '#f56c6c'],
  ['vue-lazyload', '#909399'],
  ['交叉观察器', 'rgb(170, 1, 221)'],
  ['scroll', '#8e44ad'],
  ['前端', '#3498db'],
])

const getColor = (tagName: string) => {
  return tagColorMap.get(tagName) || '#303133'
}

const changeSelect = (tagName: string) => {
  let idx = checkedTags.value.indexOf(tagName)
  if (idx === -1) checkedTags.value.push(tagName)
  else if (idx > -1) checkedTags.value.splice(idx, 1)
  // 重新筛选并重置分页
  pageNumRef.value = 1
  filterDemos()
}
</script>
<style lang="less" scoped>
.demos-container {
  padding: 24px 32px;
  max-width: 1400px;
  margin: 0 auto;
}

.demos-header {
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(230, 162, 60, 0.15);

  .section-title {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 28px;
    font-weight: 600;
    color: #333;
    margin: 0 0 8px;

    .title-icon {
      font-size: 32px;
    }
  }

  .section-desc {
    font-size: 14px;
    color: #888;
    margin: 0;
    padding-left: 44px;
  }
}

.all-demo-tags {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);

  .tags-header {
    margin-bottom: 16px;

    .tags-title {
      font-size: 16px;
      font-weight: 500;
      color: #333;
    }
  }

  .tags-list {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .tags-empty {
    padding: 20px;
    text-align: center;
    color: #999;
    font-size: 14px;
  }

  .filter-tag {
    display: inline-flex;
    align-items: center;
    cursor: pointer;
    border: 2px solid transparent;
    padding: 6px 14px;
    font-size: 13px;
    border-radius: 20px;
    transition: all 0.3s ease;
    color: #fff;

    .tag-count {
      opacity: 0.8;
      font-size: 12px;
      margin-left: 2px;
    }

    &:hover {
      transform: scale(1.08);
      filter: brightness(1.1);
    }

    &.checked {
      box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.5), 0 4px 12px rgba(0, 0, 0, 0.25);
      transform: scale(1.1);
      position: relative;
      z-index: 1;

      &::after {
        content: '✓';
        margin-left: 4px;
        font-size: 10px;
      }
    }
  }
}

.demo-content {
  min-height: 400px;
}

.demo-list {
  width: 100%;
  padding: 0;
  margin: 0;
  list-style: none;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 24px;
}

.demo-item {
  .demo-link {
    display: flex;
    flex-direction: column;
    height: 100%;
    text-decoration: none;
    background: #fff;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    border: 1px solid transparent;

    &:hover {
      transform: translateY(-8px);
      box-shadow: 0 12px 32px rgba(230, 162, 60, 0.2);
      border-color: rgba(230, 162, 60, 0.3);

      .demo-overlay {
        opacity: 1;
      }

      .demo-image {
        transform: scale(1.1);
      }
    }
  }

  .demo-image-wrapper {
    position: relative;
    width: 100%;
    padding-top: 60%;
    overflow: hidden;
    flex-shrink: 0;
  }

  .demo-image {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    transition: transform 0.4s ease;
  }

  .demo-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(230, 162, 60, 0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s ease;

    .view-demo {
      color: #fff;
      font-size: 16px;
      font-weight: 500;
      padding: 10px 24px;
      border: 2px solid #fff;
      border-radius: 25px;
    }
  }

  .demo-info {
    padding: 16px;
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .demo-name {
    display: block;
    font-size: 15px;
    font-weight: 500;
    color: #333;
    margin-bottom: 10px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .tag-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: auto;

    .demo-tag {
      display: inline-flex;
      align-items: center;
      padding: 2px 10px;
      font-size: 12px;
      border-radius: 12px;
      color: #fff;
    }
  }
}

.pagination-wrapper {
  margin-top: 32px;
  display: flex;
  justify-content: center;

  :deep(.el-pagination) {
    .el-pager li {
      border-radius: 8px;
      margin: 0 4px;

      &.is-active {
        background: linear-gradient(135deg, #e6a23c 0%, #f56c6c 100%);
        color: #fff;
      }
    }

    .btn-prev,
    .btn-next {
      border-radius: 8px;
    }
  }
}

:deep(.el-image__inner) {
  object-fit: cover;
}

@media (max-width: 768px) {
  .demos-container {
    padding: 16px;
  }

  .demo-list {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 16px;
  }
}
</style>
