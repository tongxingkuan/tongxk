# my-chats

LLM 对话全栈学习项目：NestJS + Vue 3 + PostgreSQL + Redis + 智谱 GLM，覆盖服务端开发、TypeORM、Redis、Docker 部署、CI/CD。功能包括 SSE 流式对话、对话历史、新建对话、JWT 登录。

## 架构

| 模块   | 端口 | 说明                                                      |
| ------ | ---- | --------------------------------------------------------- |
| server | 3200 | NestJS 11：JWT 鉴权、对话/消息 CRUD、SSE 流式转发智谱 GLM |
| web    | 3201 | Vue 3 + Vite + TailwindCSS 4：登录、对话历史、流式渲染    |

```
apps/my-chats/
├── server/   # NestJS 后端
├── web/      # Vue 3 前端
└── docker/   # Dockerfile + nginx + docker-compose
```

## 技术栈

- **后端**：NestJS 11、TypeORM、PostgreSQL（pg）、ioredis、@nestjs/jwt + passport-jwt、bcrypt、class-validator
- **前端**：Vue 3、Vite、TailwindCSS 4、Vue Router、Pinia、axios
- **LLM**：智谱 GLM（OpenAI 兼容 `/chat/completions` 流式接口）
- **SSE**：后端 `text/event-stream` 逐 chunk 转发；前端 `fetch` + `ReadableStream` 解析（带 Authorization 头）

## 快速开始（本地开发）

### 1. 配置后端环境变量

```bash
cp apps/my-chats/server/.env.example apps/my-chats/server/.env
# 编辑 .env，填入智谱 API Key（LLM_API_KEY）
```

### 2. 启动 PostgreSQL 与 Redis

可用 Docker 单独起基础设施：

```bash
cd apps/my-chats/docker
docker compose up -d postgres redis
```

或本地已装 PG/Redis，按 `.env` 默认值（localhost:5432 / 6379）即可。

### 3. 安装依赖并启动

```bash
pnpm install                       # 仓库根目录
pnpm --filter my-chats dev         # 并行启动 server(3200) + web(3201)
```

访问 http://localhost:3201，注册账号 → 新建对话 → 发送消息。

> server 健康检查：`GET http://localhost:3200/api/health`
> 前端通过 vite 代理 `/api` → server，生产由 nginx 反代。

## Docker 一键部署

```bash
cd apps/my-chats/docker
docker compose up --build
```

启动 4 个服务：postgres、redis、server(3200)、web(3201→80)。访问 http://localhost:3201。

> `docker-compose.yml` 通过 `env_file: ../server/.env` 读取 LLM/JWT 配置，部署前确保 `apps/my-chats/server/.env` 已就绪。
> 生产仍开启 `DB_SYNCHRONIZE=true` 自动建表（学习用途；生产建议改用 migration 并关闭 synchronize）。

## API 概览

所有 `/api/chats` 接口需 `Authorization: Bearer <token>`。

| 方法   | 路径                      | 说明                                |
| ------ | ------------------------- | ----------------------------------- |
| POST   | `/api/auth/register`      | 注册（username/password）→ 返回 JWT |
| POST   | `/api/auth/login`         | 登录 → 返回 JWT                     |
| POST   | `/api/auth/logout`        | 登出（token 加入 Redis 黑名单）     |
| GET    | `/api/health`             | 健康检查（公开）                    |
| POST   | `/api/chats`              | 新建对话                            |
| GET    | `/api/chats`              | 对话历史列表（Redis 缓存）          |
| GET    | `/api/chats/:id`          | 对话详情（含消息）                  |
| PATCH  | `/api/chats/:id`          | 更新标题                            |
| DELETE | `/api/chats/:id`          | 删除对话（级联消息）                |
| POST   | `/api/chats/:id/messages` | 发送消息，SSE 流式返回回复          |

## 数据模型

- `users`：id / username(unique) / password_hash / created_at
- `conversations`：id / user_id / title / created_at / updated_at
- `messages`：id / conversation_id / role(user|assistant) / content / created_at

## Redis 用途

- **JWT 登出黑名单**：`jwt:blacklist:{token}`，TTL = token 剩余有效期
- **接口限流**：`rl:msg:{userId}:{minute}` 固定窗口，每用户每分钟 20 条
- **对话列表缓存**：`chats:list:{userId}`，写操作失效

## CI/CD

`.github/workflows/ci.yml`：当 `apps/my-chats/**` 变更时触发，执行 pnpm install → lint → server build → web build。

## 学习要点

- **服务端**：NestJS 模块/守卫/装饰器、全局管道、ConfigModule 多环境配置
- **TypeORM**：实体关系（OneToMany/ManyToOne + 级联）、Repository 模式、synchronize
- **Redis**：ioredis 封装、缓存/限流/黑名单三种典型用法
- **SSE**：后端手动写 `text/event-stream`，转发上游流式响应；前端 ReadableStream 解析
- **Docker**：multi-stage 构建、pnpm deploy 产物、nginx 反代 + SSE 透传
- **CI/CD**：GitHub Actions 矩阵校验 lint/typecheck/build
