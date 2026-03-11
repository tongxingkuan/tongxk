<template>
  <Title>面试题</Title>
  <div class="questions-container">
    <div class="questions-header">
      <h2 class="section-title">
        <span class="title-icon">💡</span>
        面试题库
      </h2>
      <p class="section-desc">高频面试题，助你offer拿到手软</p>
    </div>
    <ul v-if="questionsRef.length > 0" class="question-list">
      <li v-for="(question, index) in questionsRef" :key="question._path || question.path" class="question-item">
        <nuxt-link :to="question._path || question.path" class="question-link">
          <div class="question-badge">{{ index + 1 + (pageNumRef - 1) * pageSizeRef }}</div>
          <span class="question-name">{{ question.title || question.name }}</span>
          <span class="question-arrow">→</span>
        </nuxt-link>
      </li>
    </ul>
    <noData v-else></noData>
    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="pageNumRef"
        v-model:page-size="pageSizeRef"
        :page-sizes="[10, 20, 30, 40, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="totalRef"
        @size-change="getQuestions"
        @current-change="getQuestions"
        background
      >
      </el-pagination>
    </div>
  </div>
</template>
<script setup lang="ts">
// 定义结构
declare interface question {
  name: string
  path: string
  _path?: string
  title?: string
  tags?: string[]
}
// 布局
definePageMeta({
  layout: 'article',
})
// 分页相关
const questionsRef = ref<question[]>([])
const pageNumRef = ref(1)
const pageSizeRef = ref(20)
const totalRef = ref(0)

// 从 content/questions 目录获取所有面试题
const getQuestions = async () => {
  const questions = await queryContent('questions')
    .sort({ _file: 1 })
    .find()
  totalRef.value = questions?.length || 0

  // 分页
  const start = (pageNumRef.value - 1) * pageSizeRef.value
  const end = start + pageSizeRef.value
  questionsRef.value = (questions || []).slice(start, end).map(q => ({
    name: q.title || q._path?.split('/').pop() || '',
    path: q._path || '',
    _path: q._path,
    title: q.title,
    tags: q.tags || []
  }))
}
getQuestions()
</script>
<style lang="less" scoped>
.questions-container {
  padding: 24px 32px;
  max-width: 900px;
  margin: 0 auto;
}

.questions-header {
  margin-bottom: 32px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(64, 158, 255, 0.15);

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

.question-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.question-item {
  .question-link {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 18px 20px;
    background: #fff;
    border-radius: 12px;
    text-decoration: none;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: 1px solid transparent;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

    &:hover {
      transform: translateY(-3px);
      border-color: rgba(64, 158, 255, 0.3);
      box-shadow: 0 6px 20px rgba(64, 158, 255, 0.15);

      .question-badge {
        background: linear-gradient(135deg, #409eff 0%, #1785cf 100%);
        color: #fff;
      }

      .question-arrow {
        transform: translateX(4px);
        color: #409eff;
      }
    }
  }

  .question-badge {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f0f7ff;
    color: #409eff;
    font-size: 14px;
    font-weight: 600;
    border-radius: 8px;
    flex-shrink: 0;
    transition: all 0.3s ease;
  }

  .question-name {
    flex: 1;
    font-size: 15px;
    font-weight: 500;
    color: #333;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .question-arrow {
    font-size: 18px;
    color: #ccc;
    transition: all 0.3s ease;
  }
}

.pagination-wrapper {
  margin-top: 32px;
  display: flex;
  justify-content: center;

  :deep(.el-pagination) {
    --el-pagination-bg-color: #fff;
    --el-pagination-text-color: #666;
    --el-pagination-button-bg-color: #fff;

    .el-pager li {
      border-radius: 8px;
      margin: 0 4px;

      &.is-active {
        background: linear-gradient(135deg, #409eff 0%, #1785cf 100%);
        color: #fff;
      }
    }

    .btn-prev,
    .btn-next {
      border-radius: 8px;
    }
  }
}

@media (max-width: 768px) {
  .questions-container {
    padding: 16px;
  }

  .question-list {
    grid-template-columns: 1fr;
  }

  .question-item .question-link {
    padding: 14px 16px;
  }
}
</style>
