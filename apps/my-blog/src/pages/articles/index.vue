<template>
  <Title>文章</Title>
  <div class="articles-container">
    <div class="articles-header">
      <h2 class="section-title">
        <span class="title-icon">📚</span>
        技术文章
      </h2>
      <p class="section-desc">探索前沿技术，分享实战经验</p>
    </div>
    <ul v-if="articlesRef.length > 0" class="article-list">
      <li v-for="(article, index) in articlesRef" :key="article._path" class="article-item">
        <nuxt-link :to="article._path" class="article-link">
          <span class="article-index">{{ String(index + 1).padStart(2, '0') }}</span>
          <div class="article-info">
            <span class="article-title">{{ article.title }}</span>
            <span class="article-meta">
              <span v-if="article.date" class="meta-item">
                <span class="meta-icon">📅</span>
                {{ formatDate(article.date) }}
              </span>
              <span v-if="article.description" class="meta-item article-desc">
                {{ article.description }}
              </span>
            </span>
          </div>
          <span class="article-arrow">→</span>
        </nuxt-link>
      </li>
    </ul>
    <noData v-else></noData>
  </div>
</template>
<script setup lang="ts">
// 定义结构
declare interface article {
  name: string
  path: string
  _path?: string
  title?: string
  date?: string
  description?: string
}
// 布局
definePageMeta({
  layout: 'article',
})

const articlesRef = ref<any[]>([])

// 获取所有文章
const getArticles = async () => {
  const articles = await queryContent('articles')
    .sort({ date: -1 })
    .find()
  articlesRef.value = articles || []
}

const formatDate = (date: string) => {
  if (!date) return ''
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

getArticles()
</script>
<style lang="less" scoped>
.articles-container {
  padding: 24px 32px;
  max-width: 1000px;
  margin: 0 auto;
}

.articles-header {
  margin-bottom: 32px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(23, 133, 207, 0.15);

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

.article-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.article-item {
  margin-bottom: 12px;

  .article-link {
    display: flex;
    align-items: center;
    padding: 20px 24px;
    background: #fff;
    border-radius: 12px;
    text-decoration: none;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: 1px solid transparent;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

    &:hover {
      transform: translateX(8px);
      border-color: rgba(23, 133, 207, 0.2);
      box-shadow: 0 4px 16px rgba(23, 133, 207, 0.12);

      .article-arrow {
        transform: translateX(4px);
        color: #1785cf;
      }

      .article-index {
        color: #1785cf;
      }
    }
  }

  .article-index {
    font-size: 24px;
    font-weight: 700;
    color: #ccc;
    min-width: 48px;
    transition: color 0.3s ease;
  }

  .article-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }

  .article-title {
    font-size: 16px;
    font-weight: 500;
    color: #333;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .article-meta {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;

    .meta-item {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
      color: #999;
    }

    .meta-icon {
      font-size: 12px;
    }

    .article-desc {
      color: #666;
      max-width: 400px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  .article-arrow {
    font-size: 20px;
    color: #ccc;
    transition: all 0.3s ease;
    margin-left: 16px;
  }
}

@media (max-width: 768px) {
  .articles-container {
    padding: 16px;
  }

  .article-item .article-link {
    padding: 16px;
  }

  .article-item .article-index {
    font-size: 18px;
    min-width: 36px;
  }

  .article-meta {
    flex-direction: column;
    align-items: flex-start !important;
    gap: 8px !important;
  }
}
</style>
