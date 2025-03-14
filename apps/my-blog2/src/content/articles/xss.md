---
title: "网络攻击与防范"
description: "网络攻击与防范"
querys: ["xss", "XSS", "网络攻击与防范", "csrf", "CSRF"]
---

## 网络攻击与防范

本文由于网络安全术语较多，都是概念性的文字，所以大多数引用自外网。

> :c-link{name=前端常见的攻击及防御方法 href=https://blog.csdn.net/weixin_43800477/article/details/122153859 target=blank}

> :c-link{name=web攻防之XSS攻击详解——XSS简介与类型 href=https://zhuanlan.zhihu.com/p/342603075 target=blank}

### 跨站脚本攻击（XSS）

Cross Site Scripting，区别CSS所以命名XSS，攻击者通过注入恶意`HTML脚本代码`来获取用户的敏感信息。**CSP**可以用于防范XSS攻击，参考文章[http-csp](/articles/http#csp)

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
