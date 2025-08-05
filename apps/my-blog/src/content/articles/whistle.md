---
title: 'whistle'
description: 'whistle'
querys: ['whistle']
---

## whistle

### 目标

我们开发的时候，默认会打开 localhost 域名，这会导致一些跨域问题。
Whistle （读音：威斯托）可以解决这个问题。

### 安装

```bash
npm install -g whistle
```

### 使用

```bash
w2 start --init
```

### 配置

1. 打开 localhost:8899 ，rules添加代理配置

```sh
test.thedramabuzz.com 127.0.0.1:5174/
test.mydramawave.com 127.0.0.1:5174/
manage-test.mydramawave.com 127.0.0.1:5173/
test.free-reels.com 127.0.0.1:5175/
m-test.free-reels.com 127.0.0.1:5175/
admin-test.mydramawave.com
# * resCors://enable

# 如果 API 没有加 CORS，你临时可以用下面的规则给它加上 CORS
# api-test.tianmai.cn resCors://enable
```

2. 启用 HTTPS 证书，见官方文档：<https://wproxy.org/whistle/webui/https.html>

### 浏览器插件

1. 安装插件：<https://chromewebstore.google.com/detail/proxy-switchyomega-3-zero/pfnededegaaopdmhkdmcofjmoldfiped>

2. 配置插件：[示例配置](http://www.tongxingkuan.xin:3000/ZeroOmegaOptions.bak)
