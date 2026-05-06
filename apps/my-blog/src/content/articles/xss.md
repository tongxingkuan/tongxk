---
title: '网络攻击与防范'
description: '网络攻击与防范'
querys: ['xss', 'XSS', '网络攻击与防范', 'csrf', 'CSRF']
---

## 网络攻击与防范

本文由于网络安全术语较多，都是概念性的文字，所以大多数引用自外网。

> :c-link{name=前端常见的攻击及防御方法 href=https://blog.csdn.net/weixin_43800477/article/details/122153859 target=blank}

> :c-link{name=web攻防之XSS攻击详解——XSS简介与类型 href=https://zhuanlan.zhihu.com/p/342603075 target=blank}

### 跨站脚本攻击（XSS）

Cross Site Scripting，区别CSS所以命名XSS，攻击者通过注入恶意`HTML脚本代码`来获取用户的敏感信息。**CSP**可以用于防范XSS攻击，参考文章[http-csp](/articles/http#csp)

#### XSS 本质与危害

XSS 的根本成因是 **应用把不可信的用户输入作为 HTML/JS 的一部分执行**，让攻击者的 JS 跑在受害者的浏览器、受害者的源（origin）下。因此攻击者可以：

- **窃取 Cookie / Token**：`document.cookie` 上传到攻击者服务器，劫持会话。
- **伪造请求**：用受害者身份调用任意业务 API，本质是 CSRF 的超集（因为有完整 JS 执行权限，连 token/签名都能读）。
- **钓鱼篡改页面**：伪造登录框、替换链接。
- **键盘 / 粘贴板记录**：监听 `keydown`、`paste` 事件。
- **蠕虫传播**：存储型 XSS 结合社交分享能自我复制（如历史上的 Samy Worm）。

#### 反射性XSS（非持久性XSS）

##### 场景

攻击者通过电子邮件等方式给别人发送带有恶意脚本代码参数的 `URL`，当 `URL` 地址被打开时，注入脚本被传输到目标服务器上，然后服务器通过`错误信息`、`搜索结果`等等方式“反射”到受害者的浏览器上，恶意代码被 `HTML` 解析、执行。

##### 特点

1. 即时性：一次网络请求就会造成攻击
2. 诱骗点击：需要将攻击代码拼接在URL中，然后诱骗用户点击

##### 防范方式

1. 服务端永远要对客户端传过来的参数保持怀疑；
2. 客户端不要信任地址栏获取到的参数；
3. 渲染数据的时候对任何的字段都需要做 `escape` 转义编码。

#### 存储型XSS（持久型XSS）

##### 场景

一般存在于 Form 表单提交等交互功能，如`发帖留言`，`提交文本信息`等，黑客利用的 XSS 漏洞，将内容经正常功能提交进入数据库持久保存，当前端页面获得后端从数据库中读出的注入代码时，恰好将其渲染执行。

##### 特点

1. 植入型，存储在数据库中
2. 危害面广，服务器变成攻击的肉鸡

##### 防范方式

1. 服务端永远要对客户端传过来的参数保持怀疑，入库前转义；
2. 后端给前端或者前端接收到后端数据都要进行转义处理。

#### DOM-Based型XSS

##### 场景

客户端如从 URL 中提取数据并在本地执行，如果用户在客户端输入的数据包含了恶意的 JavaScript 脚本，而这些脚本没有经过适当的过滤和消毒，那么应用程序就可能受到 DOM-based XSS 攻击。

##### 特点

不依赖于服务器端的数据

##### 防范方式

需要特别注意以下的用户输入源 `document.URL`、 `location.hash`、 `location.search`、 `document.referrer` 等。

#### 字符集型XSS

1. 记住指定 `<meta charset="utf-8">`
2. XML 中不仅要指定字符集为 utf-8，而且标签要闭合

#### XSS 防御纵深

只靠"前端转义"远远不够，必须做 **多层纵深防御**：

##### 1. 输入校验 + 输出编码（根治）

核心原则：**不同的上下文需要不同的编码方式**，不能一概而论。

| 注入位置  | 编码方式                 | 示例                                |
| --------- | ------------------------ | ----------------------------------- |
| HTML 内容 | HTML 实体编码            | `<` → `&lt;`                        |
| HTML 属性 | 属性编码（引号包裹）     | `"` → `&quot;`                      |
| JS 字符串 | JS 字符串转义 + `\u00xx` | `</script>` → `\u003c/script\u003e` |
| URL 参数  | `encodeURIComponent`     | 空格 → `%20`                        |
| CSS 值    | CSS 字符转义             | `(` → `\28`                         |

错误示例：把 JSON 直接内联到 `<script>` 中而不做 `<` → `\u003c` 转义，攻击者可在 JSON 字段里插入 `</script><script>alert(1)</script>`。

##### 2. 富文本场景：白名单 + 清洗库

富文本（评论、编辑器输出）无法简单转义，因为需要保留部分 HTML。必须使用成熟的 **白名单过滤库**：

- **[DOMPurify](https://github.com/cure53/DOMPurify)**：业界标杆，浏览器 + Node 通用，默认清除所有 XSS 向量。
- **`xss` (js-xss)**：国内常用，可配置白名单标签/属性。
- 切勿手写正则过滤 `<script>`，攻击面太多（`<img onerror>`、`javascript:` 协议、SVG `onload`、`<iframe srcdoc>`、HTML 实体绕过）。

```js
import DOMPurify from 'dompurify'
el.innerHTML = DOMPurify.sanitize(userHtml, {
  ALLOWED_TAGS: ['b', 'i', 'a', 'p'],
  ALLOWED_ATTR: ['href'],
})
```

##### 3. CSP（内容安全策略）

CSP 是 **最重要的运行时防线**，即使前端代码存在漏洞，CSP 也能阻止脚本执行。通过 HTTP 响应头 `Content-Security-Policy` 下发：

```http
Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-rAnd0m'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; report-uri /csp-report
```

关键指令：

- **`script-src`**：脚本来源白名单。禁用 `'unsafe-inline'` 和 `'unsafe-eval'` 是 CSP 的核心价值。
- **`'nonce-xxx'` / `'sha256-xxx'`**：为合法的内联脚本颁发一次性令牌或哈希，避免直接关闭所有 inline。
- **`strict-dynamic`**：配合 nonce 使用，已被加载的脚本可继续动态加载其他脚本，简化 CDN 场景配置。
- **`object-src 'none'`**：禁用 `<object>`、`<embed>`，防止 Flash 遗留漏洞。
- **`base-uri 'self'`**：防止攻击者通过注入 `<base>` 劫持相对路径。
- **`frame-ancestors`**：替代 `X-Frame-Options`，防御点击劫持。
- **`report-uri` / `report-to`**：CSP 违规上报端点，灰度期用 `Content-Security-Policy-Report-Only` 只报不拦。

##### 4. Trusted Types（现代浏览器）

CSP Level 3 引入的 `require-trusted-types-for 'script'`，从根本上禁止字符串直接赋值给 `innerHTML`、`eval`、`Function` 等 **注入汇合点（sink）**，必须先经过 `TrustedHTML` 策略转换：

```js
const policy = trustedTypes.createPolicy('myPolicy', {
  createHTML: s => DOMPurify.sanitize(s),
})
el.innerHTML = policy.createHTML(userInput) // 合法
el.innerHTML = userInput // TypeError
```

这是目前防御 DOM-based XSS 最彻底的方案。

##### 5. Cookie 加固

- **`HttpOnly`**：JS 无法读取 `document.cookie`，即使 XSS 得手也偷不到核心会话 cookie。
- **`Secure`**：只走 HTTPS 传输。
- **`SameSite=Lax / Strict`**：顺带防御 CSRF。

##### 6. 框架层面的默认安全

- **React**：JSX 中 `{userInput}` 默认转义；危险点是 `dangerouslySetInnerHTML`、`href={userUrl}`（`javascript:` 协议）、`ref` 注入。
- **Vue**：`{{ }}` 和 `v-bind` 默认转义；危险点是 `v-html`、`:href`。
- **Angular**：默认 Strict Contextual Escaping，主动走 `DomSanitizer.bypassSecurityTrust*` 才会失去保护。
- 通用陷阱：**`href={userUrl}`** 需要校验协议是否为 `http(s):` / `mailto:`，否则 `javascript:alert(1)` 可绕过。

### 跨站请求伪造（CSRF）

攻击者利用用户已登录的身份，在用户不知情的情况下执行恶意请求。CSRF攻击是源于WEB的`隐式身份验证机制`。WEB的身份验证机制虽然可以保证 _一个请求是来自于某个用户的浏览器`，但却无法保证该请求是用户批准发送的！_

#### 场景

比如说你登录了一个普通网站，然后CSRF攻击者在你已经登录目标网站之后，诱使你访问一个恶意网站，恶意网站就可能会冒充你的身份来进行一些操作。

#### 特点

1. 攻击一般发起在第三方网站，而不是被攻击的网站，因此被攻击的网站无法防止攻击发生；
2. 并不是窃取数据，而是冒充操作；
3. CSRF通常是跨域的，因为外域通常更容易被攻击者掌控。但是如果本域下有容易被利用的功能，比如可以发图和链接的论坛和评论区，攻击可以直接在本域下进行，而且这种攻击更加危险。

#### 防范方式

1. 验证 HTTP **Referer** 字段

> 然而，这种方法并非万无一失。Referer 的值是由浏览器提供的，虽然 HTTP 协议上有明确的要求，但是每个浏览器对于 Referer 的具体实现可能有差别，并不能保证浏览器自身没有安全漏洞。使用验证 Referer 值的方法，就是把安全性都依赖于第三方（即浏览器）来保障，从理论上来讲，这样并不安全。
> :c-link{name=CSRF攻击原理以及防御方法 href=https://www.cnblogs.com/lsj-info/p/9479755.html target=blank}

2. 在请求地址中添加 **token** 并验证

3. 对敏感操作进行二次验证

#### CSRF 防御的核心方案深入

CSRF 防御的本质是 **确认请求是用户主观发起的**。现代工程上通常组合使用以下几种策略：

##### 1. SameSite Cookie（浏览器原生方案）

在 Cookie 上设置 `SameSite` 属性，让浏览器在跨站请求时不自动附带 Cookie：

- **`Strict`**：完全禁止跨站携带，安全性最高，但从外站点击链接进入也会丢失登录态，影响体验。
- **`Lax`**（Chrome 80+ 的默认值）：允许 **顶级导航 GET** 请求携带（如点击链接），`POST`、`iframe`、`img`、`XHR` 的跨站请求一律剥离。能防住绝大多数 CSRF。
- **`None`**：传统行为，必须同时加 `Secure`，仅用于需要跨站 SSO 的场景。

```http
Set-Cookie: sessionId=abc; HttpOnly; Secure; SameSite=Lax
```

##### 2. CSRF Token（Synchronizer Token）

经典方案：服务端生成与 session 绑定的随机 token，下发给前端（放在 meta、隐藏域或接口返回），后续写请求必须在 header / body 携带，服务端校验一致性。

- 因为 **攻击者无法跨域读取受害者页面**（同源策略），所以无法拿到 token。
- 适合 SSR 传统 Web 应用，SPA 需要首次接口下发。

##### 3. Double Submit Cookie

服务端把随机值同时写入 Cookie 和响应体（或由前端生成），前端请求时把 Cookie 值再通过 header 回传，服务端比对两者是否相等。

- 无需服务端存储，适合无状态架构。
- **必须配合 SameSite=Lax 以上** 使用，否则攻击者虽然读不到 cookie，但能在受害者浏览器触发带 cookie 的请求，并猜测 header 值。

##### 4. 自定义请求头 + CORS

浏览器对含自定义 header 的 `XHR/fetch` 会先发 **Preflight 预检**，攻击者的跨站页面无法伪造（CORS 会拦截）。所以要求所有写接口带 `X-Requested-With: XMLHttpRequest` 或 `X-CSRF-Token`，简单有效。

##### 5. 关键操作二次校验

改密码、转账、删除等高危操作，走短信验证码、图形验证码、密码二次确认，完全隔绝 CSRF 的自动化执行。

### DNS劫持

#### 场景

比如说，我们经常会在各种饭馆里面连一些wifi，此时WiFi就是中间代理，如果这个wifi是黑客所建立的热点wifi，那么黑客就可以截获该用户收发的所有数据。

#### 防范方式

网站都使用https进行加密，这样就算网站的数据能被拿到，黑客也无法解开。

### 点击劫持

#### 场景

通过透明的iframe覆盖原按钮

#### 防范方式

可以通过设置`X-FRAME-OPTIONS`响应头来实现，使得网页不能被iframe 嵌套。
X-FRAME-OPTIONS的属性如下：

- `DENY`：不能被嵌入到任何iframe或frame中。
- `SAMEORIGIN`：页面只能被本站页面嵌入到iframe或者frame中。
- `ALLOW-FROM URL`：只能被嵌入到指定域名的框架中。

### URL路径遍历

#### 场景

攻击者通过修改 URL 路径来访问未经授权的文件或目录。

#### 防范方式

1. 输入路径进行验证和过滤；
2. 限制文件访问权限。

### 敏感信息泄露

#### 场景

未正确保护敏感信息，使其暴露给未经授权的用户。

#### 防范方式

1. 对敏感信息进行加密存储；
2. 使用安全的传输协议；
3. 进行访问控制等。

### 其他常见 Web 攻击速览

#### SQL 注入

攻击者通过表单或 URL 注入 SQL 片段，直接操纵数据库。防御：**参数化查询 / Prepared Statement**、ORM、最小权限数据库账户、拒绝拼接 SQL。

#### SSRF（服务端请求伪造）

前端传入 URL 让服务端代为请求（如"远程图片拉取"），攻击者构造内网地址（`http://169.254.169.254/` 云元数据、`http://127.0.0.1:6379/` Redis）窃取敏感信息。防御：URL 白名单、解析后校验解析 IP 不在内网段、禁用非 HTTP 协议。

#### 原型链污染（Prototype Pollution）

通过 `__proto__` / `constructor.prototype` 污染 `Object.prototype`，导致所有对象属性被劫持。常见于 `Object.assign(target, JSON.parse(userInput))` 或老版 lodash `_.merge`。防御：`Object.create(null)` 创建纯净对象、使用 `Map`、升级依赖、递归 merge 时过滤 `__proto__` 键。

#### 依赖供应链攻击

NPM 包被投毒（如 `event-stream` 事件、`ua-parser-js` 挖矿事件）。防御：锁定 lockfile、开启 `npm audit` / `pnpm audit`、关键构建走内网镜像、审计新增依赖、生产镜像最小化。

### 纵深防御与安全头清单

生产环境建议默认开启的 HTTP 响应头：

```http
Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-xxx'; object-src 'none'
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff          # 禁止 MIME 嗅探，防止 XSS via 上传文件
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Cross-Origin-Opener-Policy: same-origin  # 防御 Spectre / tab napping
Cross-Origin-Embedder-Policy: require-corp
```

> 这一套"安全头基线"可以借助 [securityheaders.com](https://securityheaders.com/) 扫描自检。
