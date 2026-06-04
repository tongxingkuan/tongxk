# TongXK 管理平台

全栈后台管理系统：NestJS API + Vite 管理端 + React 前台。

## 架构

| 应用         | 端口 | 说明                                      |
| ------------ | ---- | ----------------------------------------- |
| my-nestjs    | 3100 | REST API，SQLite（本地）/ MongoDB（生产） |
| my-vite-app  | 3001 | 后台管理（用户/角色/PV·UV/页面配置/通知） |
| my-react-app | 3002 | 前台（登录/注册/游客/埋点/通知）          |

## 快速启动

```bash
# 根目录安装依赖
pnpm install

# 本地 SQLite 使用 sql.js（纯 JS，无需编译 native 模块）
# 生产可改用 MongoDB：在 apps/my-nestjs/.env 设置 DB_TYPE=mongodb

# 一键启动 API + 后台 + 前台
pnpm dev:platform
```

## 默认账号

- 后台管理员：`superadmin` / `superadmin@123`（可通过 `SUPERADMIN_PASSWORD` 覆盖）

## API 模块

- `POST /auth/register` `POST /auth/login` — 注册登录（公开）
- `GET /users` — 用户管理（admin）
- `GET /roles` — 角色管理（admin）
- `POST /analytics/track` — PV 埋点（游客/登录均可）
- `GET /analytics/overview` — PV/UV 统计（admin）
- `GET /page-config/public?locale=zh-CN` — 前台配置（按语言解析后下发，含 `_meta`）
- `GET /notifications/feed` — 个性化通知（按角色/用户过滤）

## 数据库切换

`apps/my-nestjs/.env`：

```env
# 本地默认
DB_TYPE=sqlite
DB_DATABASE=data/dev.sqlite

# 生产 MongoDB
# DB_TYPE=mongodb
# DB_URL=mongodb://localhost:27017
# DB_NAME=my_nestjs
```

## 多语言配置格式

后台「页面配置」支持两种多语言写法，API 会按 `?locale=` 自动解析：

1. **整包分语言**（适合 `home.hero`、`home.features`、`site.i18n`）：

```json
{
  "zh-CN": { "title": "欢迎", "subtitle": "..." },
  "en-US": { "title": "Welcome", "subtitle": "..." }
}
```

2. **字段级多语言**（适合 `site.themes[].label`）：

```json
{ "label": { "zh-CN": "清新绿", "en-US": "Fresh Green" } }
```

## 后台权限

| 能力                   | 超级管理员 | 管理员 |
| ---------------------- | ---------- | ------ |
| 仪表盘 / PV·UV         | ✅         | ✅     |
| 页面配置 / 通知        | ✅         | ✅     |
| 用户列表（只读）       | ✅         | ✅     |
| 用户编辑/删除/重置密码 | ✅         | ❌     |
| 角色管理               | ✅         | ❌     |

重启 API 后会自动同步 `admin` 角色的权限定义。

## 访问地址

- 后台：http://localhost:3001/admin/login
- 前台：http://localhost:3002
- API：http://localhost:3100/health
