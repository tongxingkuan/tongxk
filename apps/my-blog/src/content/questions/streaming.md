---
title: '流式输出刷新恢复面试题'
description: '刷新页面后流式输出继续渲染：服务端持久化与续传、前端游标恢复'
querys: ['流式输出', 'SSE', '断点续传', '刷新恢复', 'Last-Event-ID', '游标', 'LLM 流式', '打字机']
---

## 流式输出刷新恢复面试题

### 刷新页面后流式输出还能继续渲染，前端和服务端分别要做什么？

#### 问题本质

刷新 = 浏览器丢弃内存状态 + 断开原有流式连接。要"继续渲染"需要解决两件事：

1. **已生成内容的恢复** —— 刷新前已收到的内容要重新出现
2. **未完成部分的续传** —— 生成未结束时，后续 chunk 还能继续推送渲染

核心思想：**生成与传输解耦 + 中间结果持久化 + 可续传的流式接口 + 客户端游标恢复**。

#### 服务端

1. **生成任务与连接解耦**
   LLM 的生成是一个独立 job，不绑定当前 HTTP 连接。连接断了 job 仍在后台跑，产出的 chunk 写入存储。这样刷新不会中断生成。

2. **持久化中间结果**
   每产出一个 chunk 就落库（或 Redis list / 消息队列），以 `conversationId + messageId + offset` 为键，记录顺序与是否完成。

3. **可恢复的流式接口**
   提供 `GET /chat/:messageId/stream?offset=N`：

   - 任务进行中：先把存储里 `offset` 之后**已生成**的 chunk 回放给客户端，再 attach 到正在进行的流，把后续新 chunk 实时推送
   - 任务已结束：回放剩余已存 chunk 后关闭流
   - 任务不存在/出错：返回错误

4. **游标 / Last-Event-ID**
   SSE 协议内置 `id:` 字段，断线时浏览器会在重连请求里自动带上 `Last-Event-ID`。服务端据此确定续传起点。手动刷新虽不自动重连，但前端可自行读取最后一条 event id 作为 offset 重新发起。

```ts
// NestJS 风格示意
@Sse(':messageId/stream')
stream(
  @Param('messageId') id: string,
  @Query('offset', DefaultValuePipe(0)) offset: number,
) {
  const job = this.jobRegistry.get(id) // 正在跑的任务
  return from(this.store.replay(id, offset)) // 1. 回放已生成部分
    .pipe(
      concatWith(job ? job.tail$(offset) : EMPTY), // 2. 续推新 chunk 或直接结束
      map((chunk) => ({ id: String(chunk.offset), data: chunk.text })),
      finalize(() => {
        /* 注意：客户端断开不要取消 job */
      }),
    )
}
```

#### 前端

1. **持久化会话状态**
   把 `conversationId`、`messageId`、已收到 `offset` 存 sessionStorage / localStorage（或交给服务端按会话存）。刷新后读回。

2. **恢复渲染**
   用保存的 id + offset 调恢复接口。回放阶段先把已有内容**一次性**渲染出来（可直接渲染完整文本，不必逐字打字），续传阶段复用同一套增量渲染逻辑继续追加。

3. **基于 offset 去重**
   回放与续传可能重叠，按 offset 跳过已渲染的 chunk，保证幂等。

4. **渲染复用**
   回放和续传走同一套流式渲染管线（增量追加、串行队列、避免重排），只是回放是"快放"、续传是"实时"。渲染细节参见 [渲染与交互面试题](/questions/ui-rendering)。

```ts
// 前端恢复示意
const { messageId, offset } = loadState() ?? {}
const es = new EventSource(`/chat/${messageId}/stream?offset=${offset}`)
let last = offset

es.onmessage = e => {
  const id = Number(e.lastEventId)
  if (id <= last) return // 去重，保证幂等
  last = id
  appendContent(e.data) // 复用流式渲染
  saveState({ messageId, offset: last })
}

es.addEventListener('done', () => es.close())
```

#### 关键点总结

- **解耦**：生成任务独立于连接，刷新断连不影响生成
- **持久化**：chunk 带游标落库，这是恢复的基础
- **续传接口**：回放 + 续推合一，由 offset 决定起点
- **游标恢复**：前端保存 offset / lastEventId，刷新后据此续接
- **幂等**：offset 去重，回放与续传不会重复渲染

#### 衍生：与普通断线重连的区别

网络抖动的断线，浏览器/SSE 会自动重连并带上 `Last-Event-ID`；而**手动刷新**是主动行为，前端内存全丢，必须靠持久化的会话 id + offset 重新发起恢复请求——这也是为什么前端必须把游标存到 storage 而不是只放内存。
