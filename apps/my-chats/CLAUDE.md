+# my-chats

LLM 对话全栈学习项目。独立于 qiankun 微前端，不纳入主应用注册。旨在实战学习：服务端开发（NestJS）、TypeORM（PostgreSQL）、Redis、Docker 部署、CI/CD。功能含 SSE 流式对话、对话历史、新建对话、JWT 登录。

## 开发规范

继承根 [CLAUDE.md](../../CLAUDE.md) 全部规范，重点重申：

1. **永远用中文回答**。
2. **涉及文件删除需先确认**。
3. **生成代码必须经过 type check、eslint 和 dev 启动校验**（见下方验证命令）。
4. 先思考再动手，坦然面对权衡，追求最简实现。
5. 只接触必须接触的事物，不重构相邻代码，与现有风格融合。

## 架构

| 模块   | 路径               | 端口 | 说明                                                      |
| ------ | ------------------ | ---- | --------------------------------------------------------- |
| server | [server/](server/) | 3200 | NestJS 11：JWT 鉴权、对话/消息 CRUD、SSE 流式转发智谱 GLM |
| web    | [web/](web/)       | 3201 | Vue 3 + Vite + TailwindCSS 4：登录、对话历史、流式渲染    |

```
apps/my-chats/
├── server/   # NestJS 后端
├── web/      # Vue 3 前端
├── docker/   # Dockerfile + nginx + docker-compose
└── .github/  # （CI 配置在仓库根 .github/workflows/ci.yml）
```

## 技术栈

- **server**：NestJS 11、TypeORM、PostgreSQL（`pg`）、`ioredis`、`@nestjs/jwt` + `passport-jwt`、`bcrypt`、`class-validator`。LLM 调用用原生 `fetch`（Node 18+ 内置）转发智谱 SSE。
- **web**：Vue 3、Vite 6、TailwindCSS 4（`@tailwindcss/vite`，无 tailwind.config）、Vue Router、Pinia、`axios`。SSE 用 `fetch` + `ReadableStream`（需带 `Authorization` 头，`EventSource` 不支持自定义头故不采用）。
- **LLM**：智谱 GLM，OpenAI 兼容 `/chat/completions` 流式接口。

## 数据模型

- `users`：id / username(unique) / password_hash / created_at
- `conversations`：id / user_id / title / created_at / updated_at
- `messages`：id / conversation_id / role(user|assistant) / content / created_at

开发期 `DB_SYNCHRONIZE=true` 自动建表，生产建议改用 migration 并关闭。

## Redis 用途

- **JWT 登出黑名单**：`jwt:blacklist:{token}`，TTL = token 剩余有效期
- **接口限流**：`rl:msg:{userId}:{minute}` 固定窗口，每用户每分钟 20 条
- **对话列表缓存**：`chats:list:{userId}`，写操作失效

## API 概览

所有 `/api/chats` 接口需 `Authorization: Bearer <token>`。详见 [README.md](README.md)。

| 方法   | 路径                                                      | 说明                       |
| ------ | --------------------------------------------------------- | -------------------------- |
| POST   | `/api/auth/register` `/api/auth/login` `/api/auth/logout` | 注册/登录/登出             |
| GET    | `/api/health`                                             | 健康检查（公开）           |
| POST   | `/api/chats`                                              | 新建对话                   |
| GET    | `/api/chats`                                              | 对话历史列表（Redis 缓存） |
| GET    | `/api/chats/:id`                                          | 对话详情（含消息）         |
| PATCH  | `/api/chats/:id`                                          | 更新标题                   |
| DELETE | `/api/chats/:id`                                          | 删除对话（级联消息）       |
| POST   | `/api/chats/:id/messages`                                 | 发送消息，SSE 流式返回回复 |

## 常用命令

```bash
# 仓库根目录执行
pnpm install
pnpm --filter my-chats dev          # 并行启动 server(3200) + web(3201)
pnpm --filter my-chats-server dev   # 仅后端
pnpm --filter my-chats-web dev      # 仅前端
pnpm --filter my-chats build        # server nest build + web vite build
pnpm --filter my-chats lint         # server + web eslint --fix

# Docker 一键部署（含 postgres/redis/server/web）
cd apps/my-chats/docker && docker compose up --build
```

## 验证命令（生成代码后必跑）

```bash
pnpm --filter my-chats-server build        # server typecheck + 构建
pnpm --filter my-chats-server exec eslint "src/**/*.ts"
pnpm --filter my-chats-web build           # web vue-tsc + vite build
pnpm --filter my-chats-web exec eslint .
# 根 lint（全仓 preset，my-chats 也需通过）
npx eslint apps/my-chats
# 启动校验：确保 dev 能正常起服、路由全部 mapped、无运行时报错
#   前置：postgres + redis 已起（cd apps/my-chats/docker && docker compose up -d postgres redis）
#   期望日志：Found 0 errors → Mapped {...} route ×N → Nest application successfully started
pnpm --filter my-chats-server dev
```

## 代码规范要点

- **eslint**：server 与 web 均复用根 [preset](../../packages/preset/eslint.config.mjs) 的 `eslintPreset()`（与 my-vite-app 一致）。server 在 [eslint.config.mjs](server/eslint.config.mjs) 中将类型检查的 `project` 覆盖为 `./tsconfig.json`。**勿改用 prettier 独立配置**——会与根 preset 风格冲突（trailing comma、type literal 分隔符）。
- **格式**：无分号、单引号、2 空格、`printWidth 120`、`arrowParens avoid`、`trailingComma es5`、`endOfLine lf`（见根 [.prettierrc](../../.prettierrc)）。
- **server TS**：`strict: true` + `strictPropertyInitialization`，TypeORM 实体属性用 `!:` 确定赋值断言；装饰器签名中的类型用 `import type` 引入（`isolatedModules` + `emitDecoratorMetadata` 要求）。
- **web TS**：`@vue/tsconfig` 严格模式，`src/*` 路径别名。
- 共享依赖（vue / vue-router / eslint / tailwindcss / globals 等）走根 `pnpm-workspace.yaml` 的 `catalog:`。

## 配置

- 后端环境变量见 [server/.env.example](server/.env.example)：数据库、Redis、JWT、智谱 `LLM_BASE_URL` / `LLM_API_KEY` / `LLM_MODEL`。**真实 key 放 `server/.env`，勿写入 `.env.example`**。
- 前端开发通过 vite 代理 `/api` → `http://localhost:3200`；生产由 nginx 反代（[docker/nginx.conf](docker/nginx.conf)），SSE 已关闭 `proxy_buffering`。
- `docker-compose.yml` 通过 `env_file: ../server/.env` 读取 LLM/JWT 配置。

## 注意事项

- **不接 qiankun**：独立全栈学习项目，勿在 [apps/my-blog/src/plugins/qiankun.client.ts](../my-blog/src/plugins/qiankun.client.ts) 注册本应用。
- **SSE 透传**：任何反代层（nginx / 网关）必须关闭缓冲并拉长 `proxy_read_timeout`，否则流式渲染会被截断。
- **bcrypt 原生编译**：依赖 `pnpm-workspace.yaml` 中 `bcrypt: true` 允许构建；切换 Node 版本需重装。
- 涉及 `dist/`、`node_modules/` 不要手动改动。
- 改动 server 路由前缀或 SSE 协议时，需同步检查 web [api/chats.ts](web/src/api/chats.ts) 的解析逻辑。

## 待优化（TODO）

### 1. 流式 Markdown 增量高亮

当前 assistant 消息整体作为字符串累积，渲染时一次性解析 markdown。目标：流式过程中**不等代码块/标记闭合就开始高亮**，每个 token 到达即对已累积文本增量重排。

- 关键点：未闭合代码块先按纯文本兜底（带光标 `▌`），闭合后一次性着色，避免来回闪烁（可参考 my-blog [stream-render demo](../my-blog/src/pages/demos/stream-render.vue) 的 Worker 方案）。
- 高亮放 Web Worker，避免长代码块阻塞主线程导致输入/滚动卡顿。
- 仅对「最后一个未封口块」每 tick 重算，已封口块缓存着色结果。

### 2. 生成中刷新页面，从断点继续且历史不受影响

当前刷新即丢失正在进行的 SSE 连接，assistant 消息可能只存了部分（`streamMessage` 在流结束才 `save` assistant 消息）。目标：刷新后能恢复到刷新前的生成进度，且历史对话记录完整。

- 关键点：
  - 服务端：流式过程中**分段持久化** assistant 消息（按 chunk 或定时 flush 到 DB），而非等流结束一次性存；记录「生成中」状态（conversation/message 加 status 字段）。
  - 服务端：支持断点续传——前端带 `lastReceivedOffset` 重新发起，服务端从该位置继续推流（需要 LLM 侧支持，或服务端缓存已生成内容回放）。
  - 前端：进入对话时若检测到 `status=generating`，自动重连续传接口，而非当作已完成。
  - 历史记录完整性：刷新前的 user 消息已存（流开始前 `save`），assistant 分段存保证部分内容不丢。

### 3. 评估：服务端是否对 LLM 输出做存储与处理（而非纯透传）

**现状**：[chats.service.ts](server/src/chats/chats.service.ts) `streamMessage` 边收 LLM delta 边透传给前端（`send({ content: delta })`），同时累积 `full` 在流结束后一次性存 assistant 消息。前端负责 markdown 解析与渲染。

**评估结论**：纯透传 + 前端渲染是流式场景的合理基线，但服务端应增加「处理」层，而非把原始 delta 直接外露：

- **应做（服务端）**：
  - 内容安全过滤（敏感词/越狱输出截断）、token 限流（已有 `rl:msg` 限流，可加单次输出长度上限）。
  - 分段持久化（见 TODO 2），支持断点续传与刷新恢复。
  - 错误重试/降级：LLM 上游超时或 5xx 时服务端可重试一次再透传错误，避免前端直接看到裸 502。
- **不建议做（服务端）**：markdown 解析/高亮。流式 markdown 的中途态解析复杂（未闭合代码块、表格、列表嵌套），放服务端会增加延迟且难以与 TODO 1 的前端增量高亮协同。解析与高亮统一在前端做，服务端只下发文本 delta（或未来下发结构化「块」标记，但仍由前端着色）。
- **可选增强**：服务端下发结构化 SSE 事件（`{type:'delta'|'block-start'|'block-end', content}`），让前端按块渲染而非纯字符累积——但仅当 TODO 1 的纯前端方案遇到瓶颈时再引入，避免过度设计。
