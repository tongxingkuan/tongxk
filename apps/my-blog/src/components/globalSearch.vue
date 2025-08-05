<script setup lang="ts">
import type { QueryBuilderParams } from '@nuxt/content'
import { NButton } from 'naive-ui'
const queryStr = ref<string>('')
const query = computed<QueryBuilderParams>(() => ({
  path: '/',
  where: [{ querys: { $contains: queryStr.value } }],
}))
</script>

<template>
  <div class="relative flex items-center justify-center h-full">
    <div class="flex items-center gap-2 justify-center">
      文章搜索：
      <input v-model="queryStr" placeholder="ctrl + k" />
    </div>
    <ContentList :query="query">
      <template #default="{ list }">
        <x-search-list
          class="absolute right-0 w-full bg-white shadow !p-3 max-h-[210px] overflow-y-auto top-full rounded-md z-10"
        >
          <li
            v-for="article in list"
            :key="article._path"
            class="flex w-full h-10 flex-col justify-center px-2 gap-2 truncate"
          >
            <NuxtLink :to="article._path">
              <div class="text-lg font-bold w-full truncate">
                {{ article.title }}
              </div>
              <div class="text-sm text-gray-500 w-full truncate">
                {{ article.description }}
              </div>
            </NuxtLink>
          </li>
        </x-search-list>
      </template>
      <template #not-found>
        <NButton class="gs-container-search-no-data">搜索</NButton>
      </template>
    </ContentList>
  </div>
</template>
