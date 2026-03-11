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
  const articles = await queryContent('articles').sort({ date: -1 }).find()
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
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.article-item {
  .article-link {
    display: flex;
    align-items: stretch;
    padding: 0;
    background: #fff;
    border-radius: 12px;
    text-decoration: none;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: 1px solid #e5e7eb;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    overflow: hidden;

    &:hover {
      transform: translateX(8px);
      border-color: #1785cf;
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
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    padding: 20px 0;
    font-size: 14px;
    font-weight: 600;
    color: #1785cf;
    background: #f8fafc;
    transition: color 0.3s ease;
    flex-shrink: 0;
  }

  .article-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 16px 16px 16px 0;
    min-width: 0;
  }

  .article-title {
    font-size: 16px;
    font-weight: 500;
    color: #333;
    margin: 0 0 6px;
    line-height: 1.4;
  }

  .article-meta {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;

    .meta-item {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: #999;
    }

    .meta-icon {
      font-size: 11px;
    }

    .article-desc {
      display: inline-block;
      color: #666;
      font-size: 13px;
      line-height: 1.4;
    }
  }

  .article-arrow {
    display: flex;
    align-items: center;
    padding: 0 20px;
    font-size: 18px;
    color: #dcdfe6;
    transition: all 0.3s ease;
  }
}

@media (max-width: 768px) {
  .articles-container {
    padding: 12px;
    max-width: 100%;
    overflow-x: hidden;
  }

  .articles-header {
    margin-bottom: 16px;
    padding-bottom: 12px;

    .section-title {
      font-size: 20px;
      gap: 8px;

      .title-icon {
        font-size: 22px;
      }
    }

    .section-desc {
      font-size: 12px;
      padding-left: 30px;
    }
  }

  .article-list {
    gap: 10px;
  }

  .article-item {
    .article-link {
      flex-direction: column;
      align-items: stretch;
      border-radius: 10px;
      min-height: 88px;
    }

    .article-index {
      display: none;
    }

    .article-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 12px 14px;
      gap: 4px;
    }

    .article-title {
      font-size: 15px;
      font-weight: 500;
      color: #333;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      margin: 0;
    }

    .article-meta {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-top: 4px;

      .meta-item {
        font-size: 12px;
        color: #999;
        white-space: nowrap;
      }

      .article-desc {
        flex: 1;
        font-size: 13px;
        color: #999;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        min-width: 0;
      }
    }

    .article-arrow {
      display: none;
    }
  }
}
</style>
