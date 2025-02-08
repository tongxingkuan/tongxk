<template>
  <Title>文章</Title>
</template>
<script setup lang="ts">
// 定义结构
declare interface article {
  name: string;
  path: string;
}
// 布局
definePageMeta({
  layout: "article",
});
</script>
<style lang="less" scoped>
.article-list {
  padding: 20px;

  li {
    width: 100%;

    .article-link {
      display: block;
      height: 40px;
      line-height: 40px;
      width: 100%;
      display: flex;
      .index {
        display: inline-block;
        width: 30px;
        text-align: right;
        margin-right: 10px;
      }

      .title {
        display: inline-block;
        text-align: right;
        margin-right: 10px;
        flex-shrink: 0;
      }
    }
  }
}
</style>
