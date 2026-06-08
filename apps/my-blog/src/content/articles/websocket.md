---
title: 'WebSocket'
description: 'WebSocket 协议、心跳重连、工程实践与规模化方案'
querys: ['WebSocket', 'websocket', 'ws', 'wss', 'SSE', '长连接', '心跳', 'Socket.IO']
---

## WebSocket

### 为什么需要 WebSocket

传统 HTTP 是 **请求-响应** 模型：客户端发起，服务端应答，连接随即关闭（或短连接复用）。对于 **实时性要求高、服务端需主动推送** 的场景，HTTP 的 workaround 有：

| 方案      | 原理                                  | 缺点                           |
| --------- | ------------------------------------- | ------------------------------ |
| 短轮询    | 定时发 HTTP 请求                      | 延迟高、浪费带宽、服务端压力大 |
| 长轮询    | 请求挂起直到有数据                    | 连接数占用高、仍有 HTTP 开销   |
| SSE       | 服务端单向推送（`text/event-stream`） | **仅服务端 → 客户端**，无双向  |
| WebSocket | 全双工长连接                          | 需额外维护连接状态、网关配置   |

WebSocket 在 **一次 HTTP 握手** 后升级为持久 TCP 连接，双方可随时互发 **帧（Frame）**，协议开销极低（2-14 字节头），适合：

- IM 聊天、在线客服
- 实时协作（文档、白板）
- 行情推送、游戏状态同步
- AI 流式输出（配合 SSE 也可，但双向场景 WebSocket 更灵活）
- IoT 设备上报

### 握手过程

WebSocket 连接从普通 HTTP 请求开始，通过 **Upgrade** 机制切换协议：

```http
GET /chat HTTP/1.1
Host: server.example.com
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 13
Origin: https://example.com
```

服务端响应：

```http
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzh/V8+FTo=
```

`Sec-WebSocket-Accept` 的计算方式：`Base64(SHA1(Sec-WebSocket-Key + GUID))`，GUID 固定为 `258EAFA5-E914-47DA-95CA-C5AB0DC85B11`。

握手完成后，同一 TCP 连接上的后续通信不再走 HTTP，而是 WebSocket 帧协议。

### 浏览器 API

```js
const ws = new WebSocket('wss://api.example.com/ws?token=xxx')

ws.onopen = () => {
  ws.send(JSON.stringify({ type: 'join', roomId: 'abc' }))
}

ws.onmessage = event => {
  const msg = JSON.parse(event.data)
  console.log('received:', msg)
}

ws.onerror = err => console.error('ws error', err)

ws.onclose = event => {
  console.log('closed', event.code, event.reason)
  // code 1000 = 正常关闭；1006 = 异常断开（无 close frame）
}

// 发送二进制
const buffer = new Uint8Array([1, 2, 3])
ws.send(buffer.buffer)

ws.close(1000, 'bye')
```

**readyState** 状态机：

| 值  | 常量       | 含义   |
| --- | ---------- | ------ |
| 0   | CONNECTING | 握手中 |
| 1   | OPEN       | 可通信 |
| 2   | CLOSING    | 关闭中 |
| 3   | CLOSED     | 已关闭 |

`send()` 仅在 `OPEN` 状态有效；`CONNECTING` 时发送会抛错或缓冲（浏览器实现差异），工程上应等 `onopen` 后再发。

### 与 SSE 的对比

| 维度     | WebSocket            | SSE                           |
| -------- | -------------------- | ----------------------------- |
| 方向     | 全双工               | 服务端 → 客户端               |
| 协议     | 独立帧协议（ws/wss） | 基于 HTTP                     |
| 数据格式 | 文本 / 二进制        | 仅文本（UTF-8）               |
| 自动重连 | 需自己实现           | 浏览器原生 `EventSource` 支持 |
| 代理/CDN | 需配置 Upgrade 支持  | 普通 HTTP 即可                |
| 适用场景 | 聊天、协作、游戏     | 日志流、AI token 流、通知     |

### 心跳与重连

TCP 连接可能因 NAT 超时、负载均衡 idle timeout、网络切换而 **静默断开**（不会触发 `onclose`）。工程上必须实现：

#### 1. 应用层心跳（Ping/Pong）

WebSocket 协议本身有 Ping/Pong 控制帧，但浏览器 **不提供 API 发送 Ping**，通常用 JSON 心跳：

```js
const HEARTBEAT_INTERVAL = 30_000
const HEARTBEAT_TIMEOUT = 10_000

let heartbeatTimer
let pongTimer

function startHeartbeat(ws) {
  heartbeatTimer = setInterval(() => {
    if (ws.readyState !== WebSocket.OPEN) return
    ws.send(JSON.stringify({ type: 'ping', ts: Date.now() }))

    pongTimer = setTimeout(() => {
      ws.close(4000, 'heartbeat timeout')
    }, HEARTBEAT_TIMEOUT)
  }, HEARTBEAT_INTERVAL)
}

ws.onmessage = e => {
  const msg = JSON.parse(e.data)
  if (msg.type === 'pong') {
    clearTimeout(pongTimer)
  }
}
```

服务端（Node.js `ws` 库）可调用 `ws.ping()` 发送协议级 Ping。

#### 2. 指数退避重连

```js
function createReconnectableWebSocket(url, options = {}) {
  const { maxRetries = Infinity, baseDelay = 1000, maxDelay = 30_000 } = options
  let retries = 0
  let ws
  let manualClose = false

  function connect() {
    ws = new WebSocket(url)

    ws.onopen = () => {
      retries = 0
      options.onOpen?.(ws)
    }

    ws.onmessage = e => options.onMessage?.(e, ws)
    ws.onerror = e => options.onError?.(e, ws)

    ws.onclose = e => {
      options.onClose?.(e, ws)
      if (manualClose || retries >= maxRetries) return

      const delay = Math.min(baseDelay * 2 ** retries, maxDelay)
      retries++
      setTimeout(connect, delay + Math.random() * 1000) // jitter 防惊群
    }
  }

  connect()

  return {
    get socket() {
      return ws
    },
    close() {
      manualClose = true
      ws?.close(1000)
    },
  }
}
```

#### 3. 断线消息补偿

重连后客户端应携带 **lastMessageId / lastSeq**，服务端 replay 离线期间的消息，避免丢消息。

### 消息协议设计

裸 JSON 在业务复杂后会难以维护，推荐约定统一 envelope：

```json
{
  "type": "chat.message",
  "id": "msg-uuid",
  "seq": 1024,
  "ts": 1717843200000,
  "payload": { "roomId": "abc", "text": "hello" }
}
```

要点：

- **type** 区分业务事件，前端用策略模式 / 事件总线分发。
- **id / seq** 用于去重、排序、断线补偿。
- **ts** 客户端与服务端时钟可能不一致，仅作参考。
- 大 payload 考虑分片或走 HTTP 下载链接。

### 安全

- **必须 wss**：生产环境用 TLS，防止中间人窃听/篡改。
- **握手鉴权**：Token 放 query（`?token=`）或首条消息鉴权；query 会进日志，更安全的做法是用 **Cookie（同源）** 或首包 auth。
- **Origin 校验**：服务端检查 `Origin` 头，拒绝非法来源。
- **消息大小限制**：防 DoS，服务端设 max frame size。
- **Rate Limiting**：单连接 / 单 IP 消息频率限制。

### 多 Tab 共享连接

每个 Tab 各建一条 WebSocket 浪费连接数且状态不一致。常见方案：

1. **Shared Worker** 统一管理连接，各 Tab 通过 `MessagePort` 通信（参见 [Web Worker](/articles/webworker)）。
2. **BroadcastChannel + Leader Election**：选举一个 Tab 持连接，其余 Tab 通过 BC 转发。
3. **Service Worker** 代理（复杂，Safari 支持有限）。

### 服务端与规模化

#### Node.js 示例（ws 库）

```js
import { WebSocketServer } from 'ws'

const wss = new WebSocketServer({ port: 8080 })

wss.on('connection', (ws, req) => {
  const token = new URL(req.url, 'http://localhost').searchParams.get('token')
  if (!verifyToken(token)) {
    ws.close(4001, 'unauthorized')
    return
  }

  ws.on('message', data => {
    const msg = JSON.parse(data.toString())
    handleMessage(ws, msg)
  })

  ws.isAlive = true
  ws.on('pong', () => {
    ws.isAlive = true
  })
})

// 全局心跳检测
setInterval(() => {
  wss.clients.forEach(ws => {
    if (!ws.isAlive) return ws.terminate()
    ws.isAlive = false
    ws.ping()
  })
}, 30_000)
```

#### 水平扩展

单机 WebSocket 连接数受内存和文件描述符限制（通常万级）。多实例部署时：

- **Sticky Session（会话保持）**：负载均衡按 IP / Cookie 将同一客户端固定到同一节点。
- **Pub/Sub 广播**：节点间通过 Redis Pub/Sub、Kafka、NATS 转发消息，解决跨节点推送。
- **连接注册表**：Redis 存 `userId → nodeId` 映射，发消息时先查路由再转发。

```
Client A ──ws──► Node 1 ──publish──► Redis ──subscribe──► Node 2 ──ws──► Client B
```

### WebSocket vs Socket.IO

**Socket.IO** 不是 WebSocket 的同义词，而是在 WebSocket 之上的 **通信库**：

- 传输层自动降级（WebSocket → 长轮询）。
- 内置房间（Room）、命名空间（Namespace）、ACK 回调、自动重连。
- 协议私有，客户端必须用 Socket.IO client，不能与裸 WebSocket 互通。

选型建议：

- 需要最大兼容、快速开发 → Socket.IO。
- 需要跨语言客户端、协议可控、极致性能 → 裸 WebSocket + 自定义协议。
- 仅服务端推送、单向流 → SSE 更简单。

### 调试与常见问题

- **1006 Abnormal Closure**：网络中断、代理超时、服务端 crash，无 close frame。
- **Nginx 502 / 连接立刻断开**：未配置 WebSocket 代理：

  ```nginx
  location /ws {
    proxy_pass http://backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 3600s;
  }
  ```

- **开发环境 HMR 冲突**：Vite / Webpack dev server 自身也用 WebSocket，注意端口和路径区分。
- **Chrome DevTools → Network → WS**：可查看帧内容、时序，排查心跳和消息问题。

### 典型性能数据

- 单帧头部 2-14 字节，远小于 HTTP 每次请求的数百字节 header。
- 10 万并发连接、每连接 30s 心跳：约 3300 QPS 心跳流量，需评估带宽和 CPU。
- 消息广播：O(n) 遍历连接，大房间应用考虑 **分频道 + 按需订阅**，避免全员广播。
