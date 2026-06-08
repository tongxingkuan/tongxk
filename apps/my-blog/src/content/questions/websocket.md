---
title: 'WebSocket 面试题'
description: 'WebSocket 握手、心跳重连、安全、规模化与 Socket.IO 对比'
querys: ['WebSocket', 'websocket', 'ws', 'wss', 'SSE', '长连接', '心跳', 'Socket.IO', '重连']
---

## WebSocket 面试题

> 协议详解与工程实践参见 [WebSocket](/articles/websocket)

### WebSocket 和 HTTP 有什么区别？

HTTP 是请求-响应、半双工（同一连接上客户端先请求）；WebSocket 在 HTTP 握手后 **升级为全双工长连接**，双方可随时互发数据帧，协议头开销极小（2-14 字节）。

### WebSocket 握手过程是怎样的？

客户端发 HTTP 请求，带 `Upgrade: websocket`、`Connection: Upgrade`、`Sec-WebSocket-Key`。服务端返回 `101 Switching Protocols` 和 `Sec-WebSocket-Accept`（`Base64(SHA1(key + GUID))`）。之后同一 TCP 连接走 WebSocket 帧协议，不再是 HTTP。

### WebSocket 和 SSE 怎么选？

- **WebSocket**：双向通信（聊天、协作、游戏）。
- **SSE**：仅服务端 → 客户端（AI 流式输出、日志 tail、通知），基于 HTTP，浏览器 `EventSource` 自带重连，更简单。

需要客户端频繁上报或双向实时时用 WebSocket；单向推送优先考虑 SSE。

### 为什么需要心跳机制？

NAT、负载均衡、移动网络切换会导致 TCP 连接 **静默断开**（不触发 `onclose`）。应用层定时发 ping，超时未收到 pong 则主动 `close` 并重连。服务端也可用协议级 Ping/Pong（Node `ws` 库的 `ws.ping()`）。

### 重连策略怎么设计？

- **指数退避**：1s → 2s → 4s → … capped 到 30s，加随机 jitter 防惊群。
- **区分主动关闭与异常断开**：用户 logout 时 `manualClose = true`，不再重连。
- **断线补偿**：重连时带 `lastSeq`，服务端 replay 离线消息。

### 浏览器 WebSocket 有哪些限制？

- 不支持自定义 Header（鉴权常用 query token 或首条 auth 消息）。
- 不能手动发协议级 Ping 帧。
- 受同源策略约束（但 ws/wss 不受 CORS 限制，服务端需校验 Origin）。
- `send()` 仅在 `readyState === OPEN` 时可靠。

### 多 Tab 如何避免重复建连？

用 **Shared Worker** 或 **Leader Election + BroadcastChannel** 让一个 Tab 持连接，其余 Tab 通过消息端口转发。参见 [Web Worker 面试题](/questions/webworker)。

### WebSocket 如何做鉴权？

常见方式：

1. 握手 URL 带 token：`wss://host/ws?token=xxx`（注意日志泄露）。
2. Cookie 自动携带（同源 wss）。
3. 连接建立后首条消息发 auth，验证失败 `close(4001)`。

服务端必须校验 **Origin**，生产环境必须 **wss**。

### 水平扩展时怎么跨节点推送？

单机内存里存连接，多实例需：

- 负载均衡 **Sticky Session** 固定客户端到同一节点。
- 节点间 **Redis Pub/Sub**（或 Kafka）广播，发消息时查 `userId → nodeId` 路由。

### WebSocket 和 Socket.IO 的区别？

Socket.IO 是上层库，不是 WebSocket 标准：

- 自动降级到长轮询。
- 内置 Room、ACK、自动重连。
- 协议私有，必须用 Socket.IO client。

需要跨语言、协议可控、极致性能 → 裸 WebSocket；快速开发、兼容老浏览器 → Socket.IO。

### Nginx 代理 WebSocket 要配什么？

```nginx
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
proxy_read_timeout 3600s;
```

缺 `Upgrade` 头会导致握手失败或连接立刻断开。

### close code 1006 是什么意思？

**异常关闭**：没有收到 close frame，常见于网络中断、服务端 crash、代理 idle timeout。排查方向：心跳是否生效、Nginx `proxy_read_timeout`、服务端是否 OOM。
