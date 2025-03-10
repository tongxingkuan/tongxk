---
title: "你不知道的link标签用法"
description: "link"
querys: ["link"]
---

## 你不知道的link标签用法

摘自 :c-link{name=Link标签的预加载机制 href=https://blog.csdn.net/Mr_linjw/article/details/95459878 target=blank}

link标签接触过前端的同学都已经司空见惯，我们常用 **href** 和 **rel="stylesheet"** 来引入外部样式表，偶尔也会用 **rel="icon"** 来引入网站的icon图标。**type** 用来标识资源的MIME类型。

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>
    <!-- stylesheet -->
    <link rel="stylesheet" href="../style.css" />
    <!-- type -->
    <link rel="stylesheet" href="../style.css" type="text/css" />
    <!-- icon -->
    <link rel="icon" href="../favicon.icon" />
  </head>
  <body></body>
</html>
```

接下来介绍几个不常用但却有奇效的link用法。

### Link 标签的预加载机制

#### dns-prefetch

dns-prefetch 型link提前对一个域名做dns查询

```html
<link rel="dns-prefetch" href="//example.com" />
```

#### preconnect

preconnect 型link提前对服务器建立tcp连接，一般用于加载网络字体

```html
<link href="https://fonts.demo.com" rel="preconnect" crossorigin />
```

#### prefetch

prefetch 型link提前获取指定url的资源，资源包括图片、脚本或者任何可以被浏览器缓存的资源

```html
<link rel="prefetch" href="image.png" />
```

#### preload

`preload` 针对的是当前页面需要加载的资源，使用preload加载的资源会提前下载，但是并不会立即执行，而且等到使用的时候才会执行。

1. 分离资源的下载和执行
2. 能够提高资源的下载优先级
3. 能够支持多种资源的预下载

```html
<link rel="preload" href="style.css" as="style" />
<link rel="preload" href="main.js" as="script" />
```

_当预加载的是字体资源时，必须加上crossorigin属性_

**preload** 常搭配 **as** 属性使用。

##### preload和prefetch的差异

1. preload针对的资源是当前页面需要的资源，下载的优先级很高
2. prefetch针对的资源是下个页面需要的资源，下载的优先级很低，有空的时候才下载

### as属性

**as** 指定预加载的内容的类型，将使得浏览器能够

1. 更精确地优化资源加载优先级
2. 为资源应用正确的内容安全策略
3. 为资源设置正确的 _Accept_ 请求头

可选参数有：

- audio: 音频文件
- document: 一个将要被嵌入到 **&lt;frame&gt;** 或 **&lt;iframe&gt;** 内部的 HTML 文档
- embed: 一个将要被嵌入到 **&lt;embed&gt;** 元素内部的资源
- fetch: 那些将要通过 fetch 和 XHR 请求来获取的资源，比如一个 ArrayBuffer 或 JSON 文件
- font: 字体文件
- image: 图片文件
- object: 一个将会被嵌入到 **&lt;embed&gt;** 元素内的文件
- script: JavaScript 文件
- style: 样式表
- track: WebVTT 文件
- worker: 一个 JavaScript 的 web worker 或 shared worker
- video: 视频文件

### crossorigin

`crossorigin` 属性在 `<audio>`、`<img>`、`<link>`、`<script>` 和 `<video>` 元素中有效，它们提供对 `CORS` 的支持，定义该元素如何处理跨源请求，从而实现对该元素获取数据的 CORS 请求的配置。根据元素的不同，该属性可以是一个 CORS 设置属性。

`crossorigin` 作用如下：

1. 跨域资源请求
2. 控制凭证的发送
3. 确保加载的脚本是可信任的
4. 错误处理

crossorigin 属性在错误处理方面有不同的行为，取决于属性的取值选项：

- 当 crossorigin 属性值为 `anonymous` 或未设置时，如果跨域资源加载失败，浏览器会忽略加载失败，不会报告任何错误，也不会影响页面的正常渲染。
- 当 crossorigin 属性值为 `use-credentials` 时，如果跨域资源加载失败，浏览器会在控制台报告错误，并且不会加载跨域资源。这样可以确保在有凭证的情况下，_不加载错误的或未授权的跨域资源_。
- 当 crossorigin 属性值为 `null` 时，如果跨域资源加载失败，浏览器会在控制台报告错误，并且不加载跨域资源。这种设置适用于当跨域资源加载失败时要显示错误信息，并且 _不加载其他资源_。
