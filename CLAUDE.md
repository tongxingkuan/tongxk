## 开发规范：

### 1. 永远用中文回答

### 2. 涉及到文件的删除都需要通过我的确认

### 3. 如果是生成代码，那么需要经过**type check**和**eslint**

### 4. 在编写代码之前先思考一下：不要妄下判断，不要隐藏自己的困惑，要坦然面对各种权衡

### 5. 追求简单性：最简洁的代码，解决问题

- 仅包含用户请求的功能。
- 对于一次性使用的代码，不应进行抽象。
- 没有超出我要求的任何“灵活性”或“可配置性”。
- 对于无法处理的情况，没有错误处理机制。
- 如果你写了 200 行代码，但实际上只有 50 行内容，那么请重新编写这部分代码。

### 6. 只接触那些你必须接触的事物，只清理属于你自己的混乱局面

- 不要试图“改进”相邻的代码、注释或格式。
- 不要对已经没有问题的代码进行重构。
- 与现有风格相融合，即使你希望以不同的方式来实现。
- 如果你注意到有无关的代码被删除了，请务必提出来——不要直接删除那些代码。

### 7. 明确成功的标准。不断重复这一过程，直到达到验证标准为止。

- “添加验证” → “为无效输入编写测试，确保它们能够通过验证”
- “修复这个漏洞” → “编写能够重现该漏洞的测试案例，然后确保测试通过”
- “重构 X” →

### 8. 对于需要多步完成的任务，请简要说明计划：

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

---

## 项目概览

pnpm workspace 单仓多包，核心是 **qiankun 微前端架构**：Nuxt 主应用 + 多个技术栈子应用，外加一套 NestJS 全栈后台管理系统（详见 [PLATFORM.md](PLATFORM.md)）。

### 工作区结构

| 路径                | 类型   | 说明                                                |
| ------------------- | ------ | --------------------------------------------------- |
| `apps/my-blog`      | 主应用 | Nuxt 3 博客 + 文章面试题，qiankun 主基座，端口 3000 |
| `apps/my-vite-app`  | 子应用 | Vue 3 + Vite 后台管理端，端口 3001                  |
| `apps/my-react-app` | 子应用 | React 19 + Webpack 前台，端口 3002                  |
| `apps/my-vue2-app`  | 子应用 | Vue 2 + vue-cli，端口 3003                          |
| `apps/my-nestjs`    | 后端   | NestJS 11 + TypeORM，REST API，端口 3100            |
| `packages/preset`   | 共享   | ESLint flat config 预设（`eslintPreset()`）         |
| `packages/shared`   | 共享   | 工具/组件/类型，rollup 打包                         |

### 微前端约定

- 主应用在 [apps/my-blog/src/plugins/qiankun.client.ts](apps/my-blog/src/plugins/qiankun.client.ts) 中 `registerMicroApps`，子应用挂载到 `#viteApp` / `#reactApp` / `#vue2App`，激活规则为 `/qiankun/<appName>`。
- 生产入口域名：`https://tongxingkuan.xin:<port>/`；开发用 `//localhost:<port>/`。
- 应用间通信通过全局 `window._QIANKUN_YD.event`（on/once/off/watch）。
- Vite 子应用使用 `vite-plugin-qiankun` 接入；沙箱开启 `experimentalStyleIsolation`。

### 常用命令

```bash
pnpm install                 # 安装依赖（根目录）
pnpm dev:main-app            # 仅启动博客主应用
pnpm dev:sub-apps            # 启动三个子应用
pnpm dev:platform            # 启动后台套件（nestjs + vite + react）
pnpm dev:all-apps            # 并行启动全部应用
pnpm build:all               # 全量构建
pnpm lint                    # ESLint 全仓校验
pnpm format                  # Prettier 全仓格式化
pnpm config:sync             # 同步 .vscode 配置到各 app
pnpm webp                    # 图片转 webp
```

单个应用：`pnpm --filter <name> <script>`，如 `pnpm --filter my-vite-app build:prod`。

### 代码规范要点

- ESLint flat config，根 [eslint.config.mjs](eslint.config.mjs) 直接 `export default eslintPreset()`，预设实现在 [packages/preset/eslint.config.mjs](packages/preset/eslint.config.mjs)。
- Prettier：无分号、单引号、2 空格、`printWidth 120`、`arrowParens avoid`、`trailingComma es5`、`endOfLine lf`（见 [.prettierrc](.prettierrc)）。
- TS 严格模式，`moduleResolution: bundler`，`noEmit`，根 tsconfig 见 [tsconfig.json](tsconfig.json)。
- husky pre-commit 跑 `lint-staged`：`*.{js,ts,tsx}` 走 `eslint --fix`，所有文件走 `prettier --write`。
- commit 走 commitlint conventional 规范，提交信息示例：`feat: 新增xxx` / `fix: 修复xxx`。
- 工作区版本统一通过 `pnpm-workspace.yaml` 的 `catalog:` 管理（vue / vue-router / eslint / tailwindcss 等），新增共享依赖优先用 catalog。

### 注意事项

- 涉及 `.nuxt/`、`dist/`、`node_modules/` 不要手动改动。
- my-blog 含 Nuxt Content 文章目录，新增文章按现有 frontmatter 风格编写。
- 子应用改动若影响 qiankun 挂载（容器 id、激活规则、生命周期导出），需同步检查主应用注册配置。
- 依赖版本问题优先用 `pnpm.overrides`（根 package.json）或 catalog 解决，避免在各 app 重复指定。
