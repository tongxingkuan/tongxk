---
title: '多租户管理系统'
description: '基于 NestJS + TypeORM 的多租户后台，演示租户隔离、租户上下文与成员管理'
path: '/demos/multi-tenant'
source: '/icon.webp'
tags: ['nestjs', 'typeorm', 'sqlite', '多租户']
---

## 多租户管理系统

以 `my-nestjs` 作为服务端，演示一个最小可用的多租户（Multi-Tenant）后台：

- **租户（Tenant）**：每个租户拥有独立的成员与资源，可设置档位（free / pro / enterprise）。
- **行级隔离**：所有 `members` 接口都需要通过 `x-tenant-id` 请求头声明当前租户，服务层始终基于 `tenantId` 过滤数据，避免越权读写。
- **租户上下文**：本 demo 在前端 UI 维护"当前租户"状态，并自动把它注入到每次 `fetch` 的请求头中。

### 启动后端

```bash
cd apps/my-nestjs
pnpm start:dev
# 默认端口 3100（避开 my-blog=3000、qiankun 子应用=3001/3002/3003）
# 如需自定义：PORT=4000 pnpm start:dev
```

前端默认会按环境自动切换 API：本地 `http://localhost:3100`，线上 `https://tongxingkuan.xin:3100`。页面顶部输入框也支持运行时手动覆盖。
