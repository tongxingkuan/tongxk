---
title: '前端安全面试题'
description: 'XSS 纵深防御、CSRF 防御、原型链污染、SSRF、安全响应头'
querys: ['安全', 'XSS', 'CSRF', 'CSP', 'Trusted Types', '原型链污染', 'SSRF']
---

## 前端安全面试题

> 攻击场景与防御细节参见 [网络攻击与防范](/articles/xss)

### XSS 防御的纵深分几层？

一道题考察 5 层防御：

1. **输入校验 + 输出编码**：按上下文选编码（HTML 实体、JS 字符串转义、`encodeURIComponent`、CSS 转义）。最容易踩的坑是把 JSON 内联到 `<script>` 没做 `<` → `\u003c`。
2. **富文本用白名单清洗库**：`DOMPurify`、`xss`，**不要手写正则** 过滤 `<script>`，攻击面太多（`<img onerror>`、`javascript:` 协议、SVG `onload`）。
3. **CSP**：`Content-Security-Policy` 响应头禁用 `unsafe-inline` / `unsafe-eval`，配合 `nonce` 或 `strict-dynamic` 允许合法内联脚本。
4. **Trusted Types**：`require-trusted-types-for 'script'`，从浏览器层面禁止字符串直接赋值给 `innerHTML` 等 sink，必须经过 policy 转换。
5. **Cookie 加固**：`HttpOnly` 防盗、`Secure` 走 HTTPS、`SameSite` 防 CSRF。

### CSRF 与 XSS 的本质区别？

- **XSS** 是 **攻击者的代码跑在受害者的源下**，拥有完整 JS 权限，能窃取信息、伪造任意请求。
- **CSRF** 是 **受害者被诱导向目标站发请求**，攻击者拿不到响应，只能利用浏览器自动附带的 Cookie 执行写操作（转账、改密码）。

> XSS 是 CSRF 的超集——XSS 得手后可以直接读 token 并发请求，CSRF token 防御就失效了。所以必须 **先把 XSS 堵住**，CSRF 防御才有意义。

### CSRF 有哪几种防御方案？

1. **SameSite Cookie**（浏览器原生）：`Lax`（Chrome 80+ 默认）阻止跨站 `POST`、`iframe`、`XHR` 带 cookie，能覆盖大多数场景。
2. **CSRF Token**：服务端生成与 session 绑定的随机 token，前端请求必须携带。因同源策略攻击者无法读取。
3. **Double Submit Cookie**：服务端下发随机值到 Cookie 和响应体，前端通过 header 回传，服务端比对。无状态但需配合 SameSite。
4. **自定义 header**：触发 CORS 预检（Preflight），跨站页面无法伪造。
5. **二次校验**：短信验证码、密码确认，阻断自动化。

### 原型链污染是什么？

通过 `__proto__` / `constructor.prototype` 修改 `Object.prototype`，导致所有对象属性被劫持。常见于 `Object.assign(target, JSON.parse(userInput))`、老版 lodash `_.merge`、`Object.setPrototypeOf`。防御：

- 用 `Object.create(null)` 创建无原型对象
- 关键场景用 `Map` 替代对象
- 递归合并时过滤 `__proto__`、`constructor`、`prototype` 键
- 升级到已修复的依赖版本

### SSRF 是什么？前端何时需要关心？

服务端请求伪造：前端传入 URL 让服务端代为请求（如"拉取远程图片"、"URL 预览"），攻击者构造 `http://169.254.169.254/`（云元数据）、`http://127.0.0.1:6379/`（内网 Redis）窃取敏感信息。前端层面：URL 输入要白名单协议，服务端层面要解析后校验 IP 不在内网段。

### 生产环境应该开启哪些安全响应头？

一套基线：

- `Content-Security-Policy` —— 防 XSS
- `Strict-Transport-Security` —— 强制 HTTPS
- `X-Content-Type-Options: nosniff` —— 禁止 MIME 嗅探
- `Referrer-Policy: strict-origin-when-cross-origin` —— 控制 Referer 泄露
- `Permissions-Policy` —— 关闭不需要的浏览器能力（摄像头、麦克风）
- `Cross-Origin-Opener-Policy` + `Cross-Origin-Embedder-Policy` —— 启用跨源隔离（防 Spectre，`SharedArrayBuffer` 要求）

可用 [securityheaders.com](https://securityheaders.com/) 扫描自检。
