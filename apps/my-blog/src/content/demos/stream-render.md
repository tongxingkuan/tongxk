---
title: '流式渲染 + Worker 高亮'
description: '模拟 LLM 流式输出，对比"主线程高亮 vs Web Worker 高亮"对输入流畅度的影响'
path: '/demos/stream-render'
source: '/img/demos/lazyload/loading.gif'
tags: ['前端', 'web worker', '流式输出', 'markdown', 'rag']
---

## 流式渲染 + Worker 高亮

模拟 LLM 一边吐 token、一边渲染 Markdown 的场景，对比把代码高亮放在主线程 vs Web Worker 的体验差异。可以用下面的输入框感受输入是否被卡。
