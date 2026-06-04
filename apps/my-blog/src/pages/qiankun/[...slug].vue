<template>
  <ClientOnly>
    <div id="reactApp"></div>
    <div id="viteApp"></div>
    <div id="vue2App"></div>
  </ClientOnly>
</template>

<script setup lang="ts">
/** 子应用内部改 URL 时复用同一壳，避免销毁 #viteApp 容器 */
definePageMeta({
  key: 'qiankun-shell',
})
</script>
