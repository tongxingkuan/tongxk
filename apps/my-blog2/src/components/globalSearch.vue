<script setup lang="ts">
import type { QueryBuilderParams } from "@nuxt/content";
const queryStr = ref<string>("");
const query = computed<QueryBuilderParams>(() => ({
  path: "/",
  where: [{ querys: { $contains: queryStr.value } }],
}));
</script>

<template>
  <div class="gs-container">
    文章搜索：<input
      v-model="queryStr"
      class="gs-container-search"
      placeholder="输入关键词搜索"
    />
    <ContentList :query="query">
      <template #default="{ list }">
        <ul class="gs-container-search-list">
          <el-scrollbar style="max-height: 210px; overflow: scroll">
            <li
              v-for="article in list"
              :key="article._path"
              class="gs-container-search-list-item"
            >
              <NuxtLink :to="article._path">
                <div class="title">{{ article.title }}</div>
                <div class="desc">{{ article.description }}</div>
              </NuxtLink>
            </li>
          </el-scrollbar>
        </ul>
      </template>
      <template #not-found v-if="queryStr !== ''">
        <p class="gs-container-search-no-data">没有找到相关资源</p>
      </template>
    </ContentList>
  </div>
</template>

<style lang="less">
.gs-container {
  width: 300px;
  height: 100%;
  position: relative;
  @apply flex items-center justify-center;

  pre {
    display: none;
  }

  .gs-container-search {
    width: auto;
  }

  .gs-container-search-list {
    position: absolute;
    max-height: 250px;
    border-radius: 6px;
    z-index: 10;
    @apply bg-white shadow p-3 w-full top-full;

    .gs-container-search-list-item {
      width: 100%;
      height: 50px;
      margin: 5px 0;
      padding: 5px;
      border-radius: 5px;
      display: flex;
      line-height: 20px;
      flex-direction: column;
      .title {
        font-size: 16px;
        font-weight: 600;
        height: 20px;
      }
      .desc {
        font-size: 14px;
        width: 100%;
        height: 20px;
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: hidden;
      }
    }
  }

  .gs-container-search-no-data {
    width: 300px;
    position: absolute;
    text-align: center;
    border-radius: 6px;
    z-index: 10;
    @apply text-center top-full bg-white shadow p-3 right-0;
  }
}
</style>
