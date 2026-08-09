---
title: 'HTTP'
description: 'HTTP 协议演进、三要素、TCP 三次握手、与 WebSocket 对比、HTTP/1.x 2.0 3.0 核心机制'
querys:
  [
    'http',
    'HTTP',
    'HTTP/1.0',
    'HTTP/1.1',
    'HTTP/2',
    'HTTP/3',
    'HTTPS',
    'TCP',
    '三次握手',
    'WebSocket',
    'ws',
    'QUIC',
    '多路复用',
    '队头阻塞',
    'Content-Security-Policy',
    '状态码',
    '响应头',
    '请求头',
  ]
---

## HTTP

前端开发本质上是将数据渲染到页面，数据存储在服务端数据库，要获取数据，就要通过网络请求，HTTP（HyperText Transfer Protocol），超文本传输协议，可用于传输 HTML 文档、图片、查询数据、文件下载等。HTTP 协议以 _明文_ 方式发送内容，不提供任何方式的数据加密，默认端口 **80**。作为前端开发，理解 HTTP 建立连接的过程是次要，参考文章 :c-link{name=HTTP与HTTPS的区别 href=https://www.runoob.com/w3cnote/http-vs-https.html target=blank}。本文按 **协议演进 → 三要素 → 建连握手 → 与 WebSocket 对比 → 版本核心机制** 的顺序展开。

## HTTP 协议演进

HTTP 协议从 1991 年至今经历了多次重大演进，每一次都围绕 **降低延迟、提升并发、减少开销** 三个目标。

### HTTP/0.9（1991）

蒂姆·伯纳斯-李最初设计的协议，仅用于传输 HTML。

- 只支持 `GET` 方法
- 无 Header、无状态码、无错误处理
- 请求只有一行：`GET /index.html`
- 响应直接是 HTML 文本，连接即关

### HTTP/1.0（1996）

RFC 1945，引入了现代 HTTP 的雏形。

- 引入 **Header**、**状态码**、`Content-Type`（支持传输 HTML 以外的资源）
- 新增 `POST`、`HEAD` 方法
- **每请求一连接**：请求完成立即断开，开销大
- 默认短连接，可通过 `Connection: keep-alive` 显式开启长连接但非标准

### HTTP/1.1（1997）

RFC 2616，沿用至今的基石版本。

- **`keep-alive` 长连接** 默认开启，复用 TCP 连接
- **管道化（Pipeline）**：允许同一连接上连续发送多个请求（但响应需按序，浏览器默认禁用）
- 新增 `PUT`、`DELETE`、`OPTIONS`、`TRACE`、`CONNECT` 方法
- `Host` 请求头必填（支持虚拟主机，同一 IP 承载多域名）
- 支持 `Range` 请求头，可分块/断点续传（`206 Partial Content`）
- 引入 `Cache-Control`、`ETag`、`If-None-Match` 等缓存控制字段
- **块传输编码**（`Transfer-Encoding: chunked`），可流式响应
- 遗留问题：**应用层队头阻塞**、管道化难落地，实际并发靠多 TCP 连接（Chrome 同域名 6 个）

### HTTP/2（2015）

RFC 7540，基于 HTTPS，性能大幅提升。

- **二进制分帧**：采用二进制格式传输，解析更高效
- **多路复用**：单 TCP 连接上并发多个流，应用层队头阻塞被消除
- **HPACK 头部压缩**：静态表 + 动态表 + Huffman 编码
- **服务端推送**（Server Push）：服务端预推送资源（实践中被 Chrome 105+ 等主流浏览器废弃）
- 遗留问题：底层仍是 TCP，**TCP 层队头阻塞** 未解决

### HTTP/3（2022）

RFC 9114，传输层大换血，从 TCP 切到 **QUIC（基于 UDP）**。

- **0-RTT / 1-RTT 建连**：握手与 TLS 1.3 合并，弱网首字延迟显著降低
- **流级独立**：传输层把多个流独立承载，单流丢包不阻塞其他流，彻底解决 TCP 层队头阻塞
- **连接迁移**：以 Connection ID 标识连接，与四元组解耦，WiFi 切 4G 不断连
- **TLS 1.3 内嵌**：不再在 TCP 之上叠加 TLS，握手消息封装在 QUIC 帧中
- **用户态实现**：迭代快，拥塞控制算法可随应用切换
- 缺点：部署门槛高，UDP 流量被部分网络限速

### HTTPS

HTTP 和 HTTPS 的最大区别是传输的数据是否加密。HTTPS 协议是由 HTTP 和 SSL/TLS 协议构建的可进行加密传输和身份认证的网络协议，比 HTTP 协议的安全性更高。也正是因为多了加密传输等过程，HTTP 协议在速度上比 HTTPS 快一些。HTTP 端口号默认 `80`，HTTPS 端口号默认 `443`。HTTP/2 在实践中基本都跑在 TLS 之上，HTTP/3 则把 TLS 1.3 直接内嵌进 QUIC。

### 各版本对比

| 版本     | 年份 | 传输层    | 关键特性                                                      | 主要问题                               |
| -------- | ---- | --------- | ------------------------------------------------------------- | -------------------------------------- |
| HTTP/0.9 | 1991 | TCP       | 仅 `GET`、纯文本、无 Header                                   | 功能过于简陋                           |
| HTTP/1.0 | 1996 | TCP       | 引入 Header、状态码、`Content-Type`、多方法                   | 每请求一连接，开销大                   |
| HTTP/1.1 | 1997 | TCP       | `keep-alive` 长连接、管道化、`Host`、`Range`、`Cache-Control` | 应用层队头阻塞、管道化难落地           |
| HTTP/2   | 2015 | TCP+TLS   | 二进制分帧、多路复用、HPACK 头部压缩、服务端推送              | TCP 层队头阻塞、推送已被主流浏览器废弃 |
| HTTP/3   | 2022 | QUIC(UDP) | 0-RTT、连接迁移、流级独立、TLS 1.3 内嵌                       | 部署门槛高、UDP 流量被部分网络限速     |

### HTTP 的基本特点

综合各版本，HTTP 协议本身有几个一贯特点：

- **无连接**（HTTP/1.0 默认）：每次请求新建连接，请求完成即断开；HTTP/1.1 起默认 `keep-alive` 长连接
- **串行传输**（HTTP/1.x）：又称 `单通道传输`，传输完第一个再传输第二个；HTTP/2 多路复用后单连接可并发
- **无状态**：HTTP 协议自身不对请求和响应之间的通信状态进行保存，任何两次请求之间都没有依赖关系（Cookie/Session 是应用层补丁）
- **简单快速**：协议结构简单，服务器程序规模小，通信速度快

## HTTP 三要素

下面列举的是前端开发常遇到的字段，完整参考文章 :c-link{name=前端基础HTTP篇 href=https://blog.csdn.net/by6671715/article/details/127538902 target=blank}。

### 请求头

:c-image-with-thumbnail{alt=请求头 src=/img/articles/request.png}

#### Connection

标识这个连接是否需要保持持久连接（长连接）。设置为 `keep-alive` 即支持长连接；设置为 `close` 即关闭长连接。

具体过程：

1. 客户端发送请求：当客户端发起一个 `HTTP` 请求时，在请求头中会包含一个 `Connection` 字段，标识这个连接是否需要保持持久连接。如果客户端希望保持连接，它会将该字段设置为 `keep-alive`。
2. 服务器响应：当服务器收到客户端的请求后，如果它支持长连接，它会在响应头中添加一个 `Connection` 字段，也设置为 `keep-alive`，表示服务器同意保持连接。
3. 客户端发送下一个请求：在客户端收到服务器的响应后，如果它也同意保持连接，客户端可以继续发送下一个请求。这个请求会被发送到同一连接上，而不是创建一个新的连接。
4. 保持连接或关闭连接：客户端和服务器可以在多个请求和响应之间重复步骤 `3`。当一方决定不再继续发送请求时，它可以在请求头或响应头中将 `Connection` 字段设置为 `close`，表示关闭连接。

#### Accept

可接受的响应内容类型。以 axios 为例，看下如何设置该值：

```js
import axios from 'axios'

const service = axios.create({
  baseURL: '/',
  withCredentials: true,
  timeout: 100000,
})

// 设置请求拦截器
service.interceptors.request.use(config => {
  config.headers['Accept'] = 'application/json;chartset=UTF-8;text-plain,*/*' // 接收哪些类型的参数，前后台定，可不设置，默认是json
  return config
})
```

#### Content-Type

请求体的 MIME 类型（用于 _POST_ 和 _PUT_ 请求中）。以下是封装的 _POST_ 方法，设置请求头的 **Content-Type** 值。

```js
import axios from 'axios'

const service = axios.create({
    baseURL: '/',
    withCredentials: true,
    timeout: 100000
})

const post = (url, data, useFormData = false, responseType = '') => {
  return new Promise(resolve, reject) => {
    let headers = {
      'Content-Type': 'application/json',
    }
    if (useFormData) {
      headers = {
        'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
      }
      data = qs.stringify(data)
    }
    service({
      method: 'post',
      url,
      headers,
      data,
      dataType: 'json',
      responseType: responseType
    })
      .then(res => {
        resolve(res)
      })
      .catch(error => {
        reject(error)
      })
  }
}
```

常用 Content-Type 的取值及对应的资源格式如下：

- `text/html`、`text/plain`、`text/xml`：超文本标记语言文本 .html、.html；普通文本 .txt；XML 文件 .xml
- `image/gif`、`image/jpeg`、`image/png`：GIF 图形 .gif；JPEG 图形 .jpeg、.jpg；PNG 图形 .png
- `application/json`：JSON 数据格式
- `application/x-www-form-urlencoded`：form 表单默认的提交数据的格式
- `multipart/form-data`：表单中进行文件上传时

#### Authorization

标识 HTTP 协议中需要认证资源的认证信息

#### Cookie

携带浏览器本地缓存的 cookie 信息

#### Referer

告诉服务器请求是从哪个页面链接过来的

#### Cache-Control

指定当前的请求中的资源，是否使用缓存机制，参考文章 [浏览器缓存机制](/articles/cache#cache-control)

#### 控制缓存字段

`If-Modified-Since`、`If-None-Match`。参考文章 [浏览器缓存机制](/articles/cache#协商缓存)

### 状态码

常用的状态码如下

#### 200 OK

客户端请求成功，此时已经接收到服务端返回的数据。一般用于 _GET_ 与 _POST_ 请求

#### 201 Created

表示请求已经被成功处理，并且创建了新的资源。新的资源在响应返回之前已经被创建。_POST/PUT/PATCH_：用户新建或修改数据成功

#### 204 No Content

服务器成功处理，但未返回内容

#### 301 Moved Permanently

请求的资源已被永久的移动到新 URI，返回信息会包括新的 URI，浏览器会自动定向到新 URI。今后任何新的请求都应使用新的 URI 代替

#### 302 Moved Temporarily

请求的资源已被暂时性转移到新 URI，客户端应继续使用原有 URI

##### 301 和 302 的区别

1. `301` 是永久重定向，表示请求的资源已永久移动到新位置，客户端会自动重定向到新的 URL，搜索引擎会更新索引。
2. `302` 是临时重定向，表示请求的资源暂时移动到不同的位置，客户端会自动重定向到新的 URL，但搜索引擎会保留原来的索引。
3. `301` 适用于网站改版、域名更换等需要永久重定向的情况。
4. `302` 适用于临时的维护页面、流量调度等需要临时重定向的情况。

#### 304 Not Modified

所请求的资源未修改，服务器返回此状态码时，不会返回任何资源。客户端通常会缓存访问过的资源，通过提供一个头信息指出客户端希望只返回在指定日期之后修改的资源

#### 307 Temporary Redirect

临时重定向，与 302 类似。使用 _GET_ 请求重定向

#### 400 Bad Request

客户端请求的语法错误，服务器无法理解

#### 401 Unauthorized

请求要求用户的身份认证

#### 403 Forbidden

服务器理解客户端的请求，但是拒绝执行此请求

#### 404 Not Found

服务器无法根据客户端的请求找到资源

#### 500 Internal Server Error

服务器内部错误，无法完成请求

#### 502 Bad Gateway

作为网关或者代理服务器尝试执行请求时，从远程服务器接收到了一个无效的响应，常见于 Ngnix

#### 503 Service Unavailable

由于超载或系统维护，服务器暂时的无法处理客户端的请求

#### 504 Gateway Time-out

充当网关或代理的服务器，未及时从远端服务器获取请求

### 响应头

#### Cache-Control

对应请求中的 Cache-Control

#### 控制缓存字段

`Last-Modified`、`Etag`。参考文章 [浏览器缓存机制](/articles/cache#协商缓存)

#### Content-Security-Policy

引用自 :c-link{name=内容安全策略(CSP) href=https://blog.csdn.net/gtLBTNq9mr3/article/details/126552215 target=blank}

##### 定义

存在于静态资源（图片，js，css，html 等文件）的响应头中。

:c-image-with-thumbnail{alt=csp src=/img/articles/csp.png}

##### 指令策略

CSP 通过指令策略指定白名单，仅执行白名单内的有效域相关脚本，以及加载响应资源。

指令策略是一个字符串，由一系列策略指令所组成，每个策略指令都描述了一个针对某个特定类型资源以及生效范围的策略。

- `script-src`：指定 script 脚本加载策略

- `style-src`：指定 style 样式表加载策略

- `img-src`：指定图片资源加载策略

- `default-src`：上述三种资源的统称，可能取值
  1. `http://example.com`：指定域名
  2. `'self'`：指定资源加载限制范围为当前页面所在的域名和端口。
  3. `'unsafe-inline'`：允许使用内联资源，例如内联 `<script>` 元素、内联事件处理器 `onclick` 以及内联 `<style>` 元素。
  4. `'unsafe-eval'`：允许使用 `eval()`。
  5. `'none'`：不允许任何内容。

#### Content-Type

告诉客户端，资源的类型，还有字符编码，通常我们会看到有些网站是乱码的，往往就是服务器端没有返回正确的编码。

#### Expires

告诉客户端在这个时间前，可以直接访问缓存副本，但是因为客户端和服务器的时间不一定会都是相同的，如果时间不同就会导致问题。

#### Access-Control-Allow-Origin

指定哪些网站可以跨域资源共享。

#### Access-Control-Allow-Credentials

是否允许发送 `Cookie`。默认情况下，Cookie 不包括在 CORS 请求之中。该值为 `true`，表示服务器明确许可，Cookie 可以包含在请求中，一起发给服务器。如果服务器不要浏览器发送 Cookie，删除该字段即可。如果 `Access-Control-Allow-Origin` 为 `*`，当前字段就不能为 true。

## TCP 三次握手

HTTP 基于 TCP，建连必须先握手。三次握手的核心目的是**双向确认收发能力**：

1. **客户端 → 服务端** `SYN`：`SYN=1, seq=x`，客户端进入 `SYN_SENT`。服务端据此确认"客户端能发送"。
2. **服务端 → 客户端** `SYN+ACK`：`SYN=1, ACK=1, seq=y, ack=x+1`，服务端进入 `SYN_RCVD`。客户端据此确认"服务端能接收 + 能发送"。
3. **客户端 → 服务端** `ACK`：`ACK=1, seq=x+1, ack=y+1`，双方进入 `ESTABLISHED`。服务端据此确认"客户端能接收"。

三次之后双方都验证了对方的发送与接收能力，可以开始传输数据。

### 为什么不是两次或四次

- **为什么不是两次**：两次握手时，若客户端某个**已失效的旧 SYN** 迟到到达服务端，服务端会立即开连接并等待数据，浪费资源。第三次 ACK 让客户端有机会"否认"这种异常连接。
- **为什么不是四次**：第二步的 `SYN+ACK` 已合并"确认客户端"与"发起服务端 seq"两件事，再拆两步无意义。三次是最小完备集。

> HTTPS 在 TCP 握手之后还要做 TLS 握手（HTTP/2 一般要求 TLS 1.2+），传输层与 TLS 层叠加导致建连延迟显著——这是 HTTP/3 直接换传输栈的动机之一。

## HTTP 与 WebSocket 对比

WebSocket 同样基于 TCP，但定位完全不同：HTTP 是 **请求-响应** 模型，WebSocket 是 **全双工长连接**。WebSocket 详细的协议与工程实践参见 [WebSocket](/articles/websocket)，这里聚焦两者的差异。

### 协议模型

| 维度         | HTTP                                       | WebSocket                    |
| ------------ | ------------------------------------------ | ---------------------------- |
| 通信方向     | 请求-响应、半双工                          | 全双工，双方可随时互发       |
| 连接生命周期 | 短连接或 `keep-alive` 复用                 | 握手后持久连接，直到主动关闭 |
| 协议头开销   | 每次请求带完整 Header（数百字节起）        | 帧头仅 2-14 字节             |
| 服务端推送   | HTTP/2 Server Push（已废弃）；SSE 单向推送 | 原生支持，任意方向           |
| 状态         | 无状态（Cookie/Session 补丁）              | 有状态，连接即会话           |
| 默认端口     | 80 / HTTPS 443                             | ws 80 / wss 443              |

### 握手过程

HTTP 请求就是普通的三次握手 + 请求/响应：

```http
GET /api/users HTTP/1.1
Host: example.com
Accept: application/json
```

WebSocket 复用 HTTP/1.1 的 Upgrade 机制完成握手：

```http
GET /chat HTTP/1.1
Host: server.example.com
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 13
```

服务端返回 `101 Switching Protocols` 后，同一 TCP 连接上的后续通信不再是 HTTP，而是 WebSocket 帧协议。也就是说 **WebSocket 的握手是 HTTP，握手之后不是 HTTP**。

### 通信模式与开销

HTTP/1.x 每次请求都要带完整 Header（Cookie、User-Agent、Accept 等动辄几 KB），HTTP/2 用 HPACK 压缩后仍有开销，且请求-响应模型下服务端无法主动推送（Server Push 已被废弃，SSE 是单向）。

WebSocket 握手后协议头极小：

- 数据帧头 2-14 字节
- 无需重复发送鉴权信息（握手时建立会话）
- 服务端可随时推送，无需客户端轮询

### 适用场景

| 场景                    | 推荐       | 原因                            |
| ----------------------- | ---------- | ------------------------------- |
| 普通数据接口、文件下载  | HTTP       | 请求-响应天然契合，无状态易扩展 |
| AI 流式输出、日志推送   | SSE / HTTP | 单向推送，基于 HTTP，简单       |
| IM 聊天、协作编辑、游戏 | WebSocket  | 需要双向实时通信                |
| 高频双向数据同步        | WebSocket  | 帧头开销小，连接复用            |
| 一次性资源获取          | HTTP       | 无需维护连接状态                |

一句话总结：**请求-响应用 HTTP，双向实时用 WebSocket，单向推送优先 SSE**。

## HTTP/1.x、HTTP/2、HTTP/3 核心机制详解

这一节展开几个被反复提及但容易混淆的概念：**RTT** 是衡量网络延迟的基础指标，**管道化**和**多路复用**是不同版本对并发请求的不同解法，**头部压缩**则是 HTTP/2 起才有的优化。

### RTT（Round-Trip Time，往返时延）

RTT 指**一个数据包从发出到收到确认所经历的时间**，由传播延迟、处理延迟、排队延迟构成。它是衡量网络建连和数据交互效率的核心指标。

HTTP 建连成本通常用 RTT 描述：

- **HTTP/1.1 over TCP**：建连 1 RTT（三次握手的第三次 ACK 可携带数据）。
- **HTTPS over TCP + TLS 1.2**：TCP 1 RTT + TLS 2 RTT = 3 RTT 才能发首个应用请求。
- **HTTPS over TCP + TLS 1.3**：TCP 1 RTT + TLS 1 RTT = 2 RTT，复用 Session Ticket 可 0-RTT。
- **HTTP/3 over QUIC**：握手与 TLS 1.3 合并，首次 1 RTT，复用 0-RTT。

> 一个 HTTP 请求的**总延迟 ≈ 建连 RTT + TLS RTT + 请求 RTT + 服务端处理时间**。RTT 越多，弱网下首字延迟越高，这就是 HTTP/3 拼 0-RTT 的动机。

### 管道化（Pipeline，HTTP/1.1）

**管道化是 HTTP/1.1 对"长连接上串行请求"的改进尝试**。允许客户端在同一个 TCP 连接上**不等待响应就连续发送多个请求**，服务端按请求顺序依次响应。

```
无管道化：  req1 → resp1 → req2 → resp2 → req3 → resp3   （串行，每步都吃一个 RTT）
管道化：    req1, req2, req3 → resp1, resp2, resp3        （请求批量发出，响应按序返回）
```

看起来美好，但有几个致命问题导致浏览器默认禁用：

1. **服务端必须按序响应**：哪怕 req2 的资源已就绪，也必须等 req1 处理完才能回 resp2。req1 慢 → resp2/resp3 全部被阻塞，这就是**应用层队头阻塞（HOL）**。
2. **中间代理兼容性差**：早期代理对 Pipeline 支持不一致，容易出现响应错乱。
3. **失败处理复杂**：req1 出错时，后续 req2/req3 的处理语义模糊。
4. **幂等性限制**：非幂等请求（POST）混在管道里风险大。

结果：浏览器基本不开管道化，转而**对同域名开多个 TCP 连接**（Chrome 默认 6 个）来并发，但每个连接仍要付 TCP+TLS 握手成本，且 6 个连接之间也存在拥塞控制竞争。

### 多路复用（Multiplexing，HTTP/2）

**多路复用是 HTTP/2 对并发问题的根本解法**。在单个 TCP 连接上同时承载多个双向数据流（Stream），每个流对应一个请求/响应，帧可以乱序发送，按流 ID 重新组装。

```
HTTP/1.1（6 连接并发）：   conn1: req1/resp1   conn2: req2/resp2   ...   conn6: req6/resp6
HTTP/2（单连接多路复用）：  conn1: [stream1, stream2, stream3, ...]   帧交错传输
```

HTTP/2 引入的二进制分帧层把每个请求拆为：

- **Stream**：双向字节流，由若干帧组成，每个流有唯一 ID。
- **Message**：一个完整的请求或响应，对应一组帧。
- **Frame**：最小传输单元，带流 ID、类型、长度、标志位。

**多路复用相对管道化的优势：**

| 维度     | HTTP/1.1 管道化                | HTTP/2 多路复用               |
| -------- | ------------------------------ | ----------------------------- |
| 响应顺序 | 必须按请求顺序                 | 可乱序，谁先就绪谁先回        |
| 队头阻塞 | 应用层 HOL：慢请求阻塞后续响应 | 应用层 HOL 消除（流之间独立） |
| 并发数   | 单连接 1 个在途请求            | 单连接数百个流并发            |
| 连接数   | 浏览器开 6 个 TCP              | 1 个 TCP 即可                 |

**多路复用的遗留问题：**底层仍是一条 TCP 连接，TCP 层一旦丢包会触发重传，**该连接上所有流都被阻塞**——即 **TCP 层队头阻塞**。HTTP/2 解决了应用层 HOL，却把矛盾下移到了 TCP 层。这正是 HTTP/3 用 QUIC 把流拆到传输层独立承载的动机。

### 头部压缩（HPACK / QPACK）

HTTP/1.x 每个请求都带完整 Header（Cookie、User-Agent、Accept 等动辄几 KB），重复字段在每次请求中原样发送，浪费带宽。HTTP/2 引入 **HPACK** 算法压缩头部，HTTP/3 沿用思路但改为 **QPACK**（适配 QUIC 的乱序传输）。

**HPACK 的三个核心机制：**

1. **静态表（Static Table）**：预定义 61 个常见 Header 字段（如 `:method: GET`、`accept-encoding: gzip`），用索引号代替字段本身。
2. **动态表（Dynamic Table）**：连接级共享，客户端与服务端各自维护一份相同副本。每次请求/响应的 Header 进表后，后续相同字段只需发索引。同一连接上重复请求的 Cookie、UA 等可压缩到 1 字节索引。
3. **Huffman 编码**：对字段值做哈夫曼编码，进一步缩短字符串。

**典型效果：**首次请求 600 字节 Header，进动态表后第二次同样请求可能只需 30 字节。

**HPACK vs QPACK 的关键差异：**

| 维度       | HPACK（HTTP/2）          | QPACK（HTTP/3）                                  |
| ---------- | ------------------------ | ------------------------------------------------ |
| 传输层     | TCP，有序可靠            | QUIC，流间独立、可乱序                           |
| 动态表更新 | 必须按序，确认后才能引用 | 允许乱序，但需额外 ACK 确认表项已收到            |
| 阻塞问题   | TCP 丢包会阻塞表更新     | 流独立，但表更新仍需等待 ACK（用禁用动态表规避） |
| 编码方式   | Huffman + 整数编码       | 同 HPACK                                         |

QPACK 在设计上为了不引入新的阻塞点，对动态表引用做了**显式 ACK 机制**：发送方引用未确认的表项时，要么等 ACK，要么接受可能乱序的风险。实际场景下，QPACK 的压缩率略低于 HPACK，但避免了 TCP 层 HOL 带来的连锁阻塞。

### HTTP/3 新特性

#### 基于 QUIC 协议

QUIC（Quick UDP Internet Connections）是 IETF 标准化的基于 UDP 的可靠传输协议，原生融合 TLS 1.3，握手与加密在同一往返内完成。HTTP/3 不再依赖 TCP，而是把传输层完全交给 QUIC。

#### 0-RTT / 1-RTT 建连

- **首次连接**：1-RTT 完成握手并开始传输数据，相比 TCP + TLS 的 2-3 RTT 大幅缩短。
- **复用连接**：客户端复用之前的连接参数时实现 **0-RTT**，首包即携带应用数据，弱网首字延迟显著降低。

#### 连接迁移

传统 TCP 连接以**四元组**（源 IP、源端口、目的 IP、目的端口）标识，手机从 WiFi 切 4G 时四元组变化，连接必须重建。QUIC 以 **Connection ID** 标识连接，与四元组解耦，网络切换时连接不断，长会话无需重建。

#### 流级独立，无 TCP 队头阻塞

HTTP/2 虽然在应用层实现了多路复用，但底层仍是一条 TCP 连接，一旦丢包会阻塞该连接上所有流（**TCP 层队头阻塞**）。QUIC 在传输层把多个流独立承载，单个流丢包只阻塞自身，其他流继续推进——对多路复用场景至关重要。

#### TLS 1.3 内嵌

QUIC 直接把 TLS 1.3 作为加密层，不再像 HTTP/2 那样在 TCP 之上叠加 TLS。TLS 握手消息直接封装在 QUIC 帧中，省去一次独立握手往返，同时保留 TLS 1.3 的前向安全性。

#### 用户态实现

QUIC 跑在用户态而非内核，迭代速度快于 TCP 协议栈，拥塞控制算法可随应用切换。这对实验新算法（如 BBR）和快速修复协议缺陷非常有利，代价是 CPU 开销略高于内核态 TCP。

#### 前向纠错（FEC）可选

少量丢包可由冗余包直接恢复，无需重传。实际部署因带宽成本不常用，但在弱网高丢包场景仍有价值。
