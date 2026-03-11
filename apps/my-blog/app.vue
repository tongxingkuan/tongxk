<template>
  <Title>童话的博客</Title>
  <NuxtPage />
</template>
<style lang="less">
@import './assets/style/normalize.less';

html,
body {
  margin: 0;
  padding: 0;
  background-color: #f8fafc;
  color: #333;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

/* 移动端全局滚动优化 */
@media (max-width: 768px) {
  html,
  body {
    touch-action: pan-y;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
  }

  /* 禁用点击高亮 */
  * {
    -webkit-tap-highlight-color: transparent;
  }

  /* 优化滚动容器 */
  .overflow-y-auto,
  [overflow-y-auto] {
    -webkit-overflow-scrolling: touch;
  }
}

/* 全局链接样式 */
a {
  color: inherit;
  text-decoration: none;
}

/* 选中文字样式 */
::selection {
  background: rgba(23, 133, 207, 0.2);
  color: #333;
}
</style>
