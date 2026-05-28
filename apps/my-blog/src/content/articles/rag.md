---
title: 'RAG 与前端：从原理到落地实现'
description: '什么是 RAG（检索增强生成）、完整 pipeline、前端在 RAG 系统中的职责与关键实现：文档摄入、流式输出、引用溯源、反馈回流'
querys: ['rag', '检索增强生成', '向量检索', 'embedding', '流式输出', 'SSE', 'LLM', '引用溯源', '前端']
---

## RAG 与前端：从原理到落地实现

RAG（Retrieval-Augmented Generation，检索增强生成）是把「外部知识检索」嵌入到大模型生成流程中的范式。模型不再仅依赖训练时见过的语料，而是在每次回答前，先从知识库里检索相关片段，把它们拼进 prompt，再交给 LLM 生成答案。

本文先讲清楚 RAG 是什么、为什么需要它，再聚焦前端在 RAG 系统中具体要做哪些事、怎么做。

### 为什么需要 RAG

LLM 单独使用时有几个固有问题：

- **知识截止**：训练数据有截止时间，无法回答最新内容
- **幻觉**：模型对不知道的事会编造，且语气自信
- **私域盲区**：企业内部文档、团队 wiki、用户个人数据，模型没见过
- **可追溯性差**：答案没有出处，无法验证

相对于「重新微调一个模型」，RAG 的优势在于：

- **更新成本低**：知识更新只需重建索引，不需要重训模型
- **可解释**：能给出「答案出自哪个文档的哪一段」
- **隔离性好**：不同租户/用户的私域数据可以物理隔离，不会污染模型权重

### RAG 的完整 pipeline

一条问题从输入到答案，会经过两条相对独立的链路：**离线索引**和**在线问答**。

```text
[ 离线索引 ]
  原始文档 → 解析(parse) → 分块(chunk) → 向量化(embed) → 写入向量库

[ 在线问答 ]
  用户问题 → 改写(rewrite) → 检索(retrieve) → 重排(rerank)
          → 拼 prompt → LLM 生成 → 流式返回 → 引用溯源
```

#### 关键环节

- **分块（Chunking）**：太大命中率低、context 浪费；太小语义断裂。常见策略：按语义段落 + 固定 token 上限（如 500），相邻 chunk 重叠 50–100 token
- **向量化（Embedding）**：把文本映射成定长向量（如 1536 维），相近语义的向量距离近。常用模型 `text-embedding-3-small`、`bge-m3` 等
- **检索（Retrieval）**：从向量库里取 Top-K 个最相似片段。纯向量易漏掉精确匹配（函数名、错误码），所以工业实践常用 `hybrid = 70% 向量 + 30% BM25`
- **重排（Rerank）**：检索召回粗排，rerank 模型（cross-encoder）做精排，把真正相关的片段顶到前面
- **拼 prompt**：`system 指令 + 检索片段 + 历史对话 + 当前问题`，并明确要求模型「只基于给定上下文回答，未提及则回答不知道」
- **生成**：LLM 流式输出（SSE / chunked transfer），前端边收边渲染

### 前端在 RAG 系统里到底做什么

很多人以为 RAG 是后端的事，前端只负责"把答案打印出来"。实际上一个真正可用的 RAG 产品，前端要承担五类核心职责：

1. **文档摄入界面**：上传、解析进度、分块预览、re-index 触发
2. **查询体验**：多轮会话、查询改写提示、上下文/知识库切换
3. **流式渲染**：SSE/ReadableStream 增量展示，节流防抖、Markdown 增量解析
4. **引用溯源**：答案中插入引用标记，hover 看片段、点击跳到原文档
5. **反馈回流**：点赞点踩、修订答案、把人工标注送回服务端用于 evals 与 rerank 训练

下面挑几个**前端独有、容易踩坑**的点展开。

#### 流式输出：SSE 的标准接法

后端常用 SSE（Server-Sent Events）以 `text/event-stream` 推送 token。原生 `EventSource` 不支持自定义 header（无法传鉴权），生产里更推荐 `fetch + ReadableStream`：

```ts
async function streamChat(question: string, onDelta: (t: string) => void) {
  const res = await fetch('/api/rag/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ question }),
  })
  if (!res.body) throw new Error('no stream')

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    // SSE 协议：以 \n\n 分隔事件，每行 data: xxx
    const events = buffer.split('\n\n')
    buffer = events.pop() ?? ''
    for (const evt of events) {
      const line = evt.split('\n').find(l => l.startsWith('data:'))
      if (!line) continue
      const payload = line.slice(5).trim()
      if (payload === '[DONE]') return
      const { delta } = JSON.parse(payload)
      onDelta(delta)
    }
  }
}
```

注意点：

- **decode 必须 `stream: true`**：否则跨 chunk 的多字节 UTF-8 字符（中文/emoji）会乱码
- **AbortController**：用户切换会话或离开页面时要 `controller.abort()`，否则连接泄漏
- **断流恢复**：长回答可能被网络中断，可在协议里加 `request_id + offset`，重连时续传
- **背压**：UI 渲染速度跟不上 token 推送时，可在 `onDelta` 里做 16ms 节流（合并到下一帧再 setState）

#### Markdown 增量渲染

LLM 流式吐字，前端要边收边把 Markdown 渲染成 HTML。这件事比想象中坑：模型每吐一个 token，整段文本就处于一种"中途状态"——可能是半个代码块、半个表格、未闭合的列表项、未完整的链接 `[xxx`。直接把这种文本喂给 Markdown 解析器，会出现两类典型 bug：

- **闪烁**：本来要渲染成代码块的内容，前几个 token 阶段被识别成普通段落，等到 ``` 收齐才跳成代码块，UI 上就是"先冒一行字、再瞬间变成代码块"
- **结构错位**：表格只收到表头没收到分隔线时，会被解析成段落；后续补上分隔线后整段重排，列表/引用同理

##### 思路一：全量重渲 + 增量 DOM diff

最朴素：每次 `onDelta` 都把累积到现在的全文重新跑一遍 Markdown 解析，再交给 React/Vue 的虚拟 DOM 做 diff。

```ts
let fullText = ''
streamChat(question, delta => {
  fullText += delta
  setHtml(marked.parse(fullText)) // 框架内部 diff，只 patch 变化的节点
})
```

优点：实现简单、状态永远一致；缺点：

- 每个 token 都全量解析，1k token 的回答会触发上千次 parse + diff，主线程容易掉帧
- Shiki/Prism 这类高亮在每次 parse 后都会重跑，对长代码块尤其卡

优化手段：

- **节流到 RAF**：`onDelta` 里只追加文本，用 `requestAnimationFrame` 合并多次更新。16ms 内来的若干 token 只触发一次 parse
- **Web Worker 解析**：把 `marked.parse` 和高亮一起搬到 worker，主线程只拿 HTML 字符串，输入框始终丝滑

```ts
// main thread
let pending = ''
let scheduled = false
streamChat(question, delta => {
  pending += delta
  if (scheduled) return
  scheduled = true
  requestAnimationFrame(() => {
    worker.postMessage({ type: 'parse', text: pending })
    scheduled = false
  })
})
worker.onmessage = e => setHtml(e.data.html)
```

##### 思路二：分块流式解析

更进一步：不是每次都从头解析，而是把已经"封口"的 Markdown 块（块级元素之间用空行分隔）固化下来，只对**最后一个未完成块**做 reparse。

````text
已固化（不再变）           正在生成（每次 token 都重渲）
┌──────────────────┐      ┌─────────────────────┐
│ # 标题           │      │ ```ts               │
│                  │      │ function foo() {    │
│ 正文段一。       │      │   return 1          │
│                  │      │                     │
└──────────────────┘      └─────────────────────┘
````

判定"封口"的简单规则：当遇到连续两个换行（`\n\n`）且不在代码块/表格/列表内部时，前面的内容就可以认为稳定了。固化后的 HTML 直接拼接，不再参与 diff，对长回答性能提升明显。

社区有现成方案可参考：

- **streamdown**（Vercel AI SDK 周边）：专门处理流式 Markdown，自带"未完成代码块占位"行为
- **react-markdown** + 自定义 remark plugin：在 plugin 里把 incomplete fence 临时补全
- **marked** + `silent: true`：解析器遇到非法语法不抛错，返回尽力而为的结果

##### 处理"未闭合代码块"的小技巧

最常见的体验问题就是代码块在生成中途看起来是普通段落。一个简单粗暴的修复：**在解析前检测 ``` 是否成对，未成对就临时补一个**。

````ts
function patchUnclosedFence(text: string): string {
  const fences = text.match(/```/g)?.length ?? 0
  if (fences % 2 === 1) {
    // 奇数个 ``` 说明有一个未闭合，临时闭合它，渲染完接下一个 token 时再剥掉
    return text + '\n```'
  }
  return text
}

setHtml(marked.parse(patchUnclosedFence(fullText)))
````

同样的思路也适用于：未闭合的表格（缺分隔线时手动补 `|---|---|`）、未闭合的行内代码 `` ` ``、未闭合的链接 `[xxx`。这类"乐观补全"是流式 Markdown 体验流畅的关键。

##### 代码高亮：必须放 Worker

Shiki / Prism / highlight.js 在长代码块（>200 行）上单次高亮就可能花 50–200ms。如果跟 Markdown parse 一起在主线程同步跑，输入框、滚动都会卡。

工程上有两种做法：

1. **Worker 高亮**：parse 出 HTML 后，识别 `<pre><code class="language-xxx">`，把内容 postMessage 给 worker，worker 算完返回着色后的 HTML，主线程替换。期间 UI 上展示未高亮的纯文本，不阻塞输入
2. **延迟高亮**：流式过程中只渲染纯文本代码块，等流结束（或某个块封口）再触发一次高亮

Shiki 自带 `createHighlighter` 的 worker 版本（`shiki/wasm`），React 生态有 `shiki-renderer-react` 之类的包装可以直接用。

##### 滚动行为：别和用户抢

边渲染边自动滚到底部是 ChatGPT 的默认行为，但要做对几个细节：

- 用户手动往上滚后，**停止自动跟随**，并显示一个"回到底部"的悬浮按钮
- 自动滚动用 `scrollTop = scrollHeight`，而不是 `scrollIntoView`（后者会把整个容器拽进视口，体验奇怪）
- 流结束后再做一次最终对齐，避免最后几个 token 没跟上

#### 引用溯源 UI

后端返回时带 citations，例如：

```json
{
  "answer": "Vue 3 的响应式基于 Proxy[^1]，相比 Vue 2 的 defineProperty 解决了数组下标和新增属性的监听问题[^2]。",
  "citations": [
    { "id": 1, "doc": "vue3.md", "chunk": 12, "text": "Vue 3 通过 Proxy 实现..." },
    { "id": 2, "doc": "vue2.md", "chunk": 7, "text": "defineProperty 无法..." }
  ]
}
```

前端把 `[^n]` 替换成可点击的角标，hover 浮层展示原文片段，点击跳到知识库对应文档的 anchor。这一步是「让用户敢用 RAG」的关键 —— 没有引用，回答和瞎编无法区分。

#### 用户反馈回流

```ts
// 点踩时收集结构化反馈
function thumbsDown(messageId: string, reason: 'wrong' | 'irrelevant' | 'incomplete', note?: string) {
  fetch('/api/rag/feedback', {
    method: 'POST',
    body: JSON.stringify({ messageId, reason, note, retrievedChunks }),
  })
}
```

带上**当时检索到的 chunks**一起回传，运营后台才能复盘是「检索没召回」还是「召回了但模型没用上」。这两类问题的修复手段完全不同：

- 没召回 → 优化分块策略 / 换 embedding / 加同义词扩写
- 召回了没用 → 调 prompt / 换更强的模型 / 加 rerank

### 前端常见性能与安全坑

- **首屏 TTFB**：SSE 第一个 token 到达前的等待感，UI 上必须有打字光标 + 检索状态提示（"正在从 3 篇文档中查找…"），别让用户对着空白屏
- **Markdown XSS**：用户问题、文档内容都可能包含恶意 HTML，渲染前必须用 `DOMPurify` 清洗，或用默认禁 raw HTML 的渲染器
- **Prompt 注入提示**：当用户输入命令式语句（"忽略上面所有指令"），UI 层可做轻量识别并提示，但**真正防御要在 prompt 拼装层做**，前端只做提示
- **多轮会话压缩**：长对话超 token 上限时，由后端做摘要压缩；前端要在 UI 上明确提示"早期对话已被概括"，避免用户误以为模型还记得细节

### 一个最小落地清单

如果要从零搭一个 RAG 前端，最小可用版本要包含：

- 上传/管理知识库的页面（含分块预览）
- 会话列表 + 新建/切换会话
- 流式回答区（带打字光标、停止生成按钮）
- 引用角标 + 浮层 + 跳原文
- 点赞/点踩 + 结构化反馈表单
- 知识库切换 / 模型切换 / 检索参数（top-k、temperature）开关

把这几块做扎实，比追求"答案多智能"更能决定一个 RAG 产品是否真的可用。
