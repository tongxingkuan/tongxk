## 核心设计——渐进式披露

Skill 是一种把「专家级工作流」打包给 Agent 使用的能力单元。它不是把所有知识一次性塞进系统提示词，而是通过一种**按需加载、边界清晰、可组合**的方式，让 Agent 在面对特定任务时，精准地取出那一套「领域最佳实践」来执行。

下面按从设计哲学 → 结构 → 激活 → 编写 → 边界 → 进阶 → 评测的顺序，讲解 Skill 开发的核心要点。

:c-image-with-thumbnail{alt="渐进式披露示意" src="https://rte.weiyun.baidu.com/wiki/attach/image/api/imageDownloadAddress?attachId=bba3c423015042f780aba7b3442fb511&docGuid=l2M_9arzAdFq57"}

**渐进式披露（Progressive Disclosure）** 是 Skill 区别于传统 Prompt 的核心设计思想：

- **上下文窗口是稀缺资源。** 把所有领域知识一次性写进系统提示，不仅挤占 token、增加噪声，还会降低模型对当前任务的聚焦度。
- **按需加载。** Skill 把知识分层——仅在 Agent 判断「这个任务属于我」时才展开完整正文，进一步需要脚本/子文档时再读取。
- **三层结构**：`描述层（激活判断）→ 指令层（执行主体）→ 资源层（脚本/模板/参考文档）`，对应「看到 → 决定 → 深入」三个阶段。

这种设计让一个 Agent 可以「挂载」几十上百个 Skill 却不会臃肿，因为每次只有被命中的那一个会被完整读取。

## Skill 的结构与安装

:c-image-with-thumbnail{alt="Skill 的结构与安装" src="https://rte.weiyun.baidu.com/wiki/attach/image/api/imageDownloadAddress?attachId=146d4f42792140a59ac4a738478f03b0&docGuid=l2M_9arzAdFq57"}

一个 Skill 本质上就是一个**目录**：

```text
my-skill/
├── SKILL.md          # 必须：元数据 + 指令主体
├── scripts/          # 可选：确定性脚本（bash/python/node）
├── references/       # 可选：可按需加载的长文档
└── templates/        # 可选：代码模板、配置样例
```

**安装 = 把目录放到 Agent 能扫描到的路径**（如 `~/.comate/skills/` 或工作区 `.comate/skills/`）。Agent 启动时只会把所有 Skill 的 `description` 读入，完整 `SKILL.md` 正文只在命中后才加载。

## SKILL.md 的结构

:c-image-with-thumbnail{alt="SKILL.md 的结构" src="https://rte.weiyun.baidu.com/wiki/attach/image/api/imageDownloadAddress?attachId=e28a7037366d4ca68d27d826b45662c6&docGuid=l2M_9arzAdFq57"}

`SKILL.md` 采用 Frontmatter + Markdown 的混合结构：

```md
---
name: skill-id # 唯一标识，通常 kebab-case
description: 一句话回答「这个 Skill 什么时候用、能干什么」
---

# 正文：指令、流程、示例
```

关键区分：

- **`description`（激活层）**：模型用它判断「要不要加载我」，因此必须精准描述**触发场景 + 能力边界**。
- **正文（执行层）**：Skill 被激活后，这部分才会完整进入上下文，承载具体的「怎么做」。

## Skill 的工作原理

:c-image-with-thumbnail{alt="Skill 的工作原理" src="https://rte.weiyun.baidu.com/wiki/attach/image/api/imageDownloadAddress?attachId=3dbdd650a58249068a7ead54e22fdf9a&docGuid=l2M_9arzAdFq57"}

运行期的生命周期：

1. **扫描**：Agent 启动时遍历 Skill 目录，读取所有 `description` 汇总进系统上下文。
2. **匹配**：用户发起请求 → 模型结合用户意图与所有 `description` 判断是否命中某个 Skill。
3. **加载**：命中后，完整 `SKILL.md` 正文被注入上下文。
4. **执行**：模型按照正文的指令与流程工作；期间可按需读取 `scripts/`、`references/`。
5. **收束**：任务完成后，Skill 内容可随对话推进被压缩/淘汰，不永久占位。

## Description——激活的精准度

:c-image-with-thumbnail{alt="Description 激活的精准度" src="https://rte.weiyun.baidu.com/wiki/attach/image/api/imageDownloadAddress?attachId=f0a5c8ccecb941f294b606ffc47062b7&docGuid=l2M_9arzAdFq57"}

Description 决定了 Skill 的**召回率**与**精确率**：

- **召回率低**：用户本该用你的 Skill，但模型没加载 → 功能失效。
- **精确率低**：用户问的根本不是这个领域，模型却加载了 → 污染上下文，甚至走偏流程。

优秀的 description 做到「**一眼就能判断该不该用**」：既要覆盖常见触发说法，也要明确划出**不适用**的场景。

## Description 的三大要素

:c-image-with-thumbnail{alt="Description 的三大要素" src="https://rte.weiyun.baidu.com/wiki/attach/image/api/imageDownloadAddress?attachId=740408b49c884e8ba503a53069902686&docGuid=l2M_9arzAdFq57"}

一条可用的 description 通常包含：

1. **做什么（能力）**：这个 Skill 解决哪类问题，产出是什么。
2. **何时用（触发）**：列举典型用户说法、关键词、场景信号。
3. **何时不用（边界）**：明确 out-of-scope，防止误激活。

三要素缺一不可：只有「做什么」会误激活；只有「何时用」脱离能力定义；没有「何时不用」会抢别的 Skill 的活。

## Description 实例：git-commit-workflow

:c-image-with-thumbnail{alt="Description 实例 git-commit-workflow" src="https://rte.weiyun.baidu.com/wiki/attach/image/api/imageDownloadAddress?attachId=a0509e290c9644678d0172297c2e4220&docGuid=l2M_9arzAdFq57"}

以 `git-commit-workflow` 为例，好 description 的写法：

> 当用户完成代码修改、准备提交时使用。自动收集 `git diff`、匹配 iCafe 活跃卡片、生成符合规范的 commit message 并引导绑定卡片。**仅在用户明确要"提交代码""commit"时触发**；纯粹讨论 commit 规范或查询历史提交时不使用。

这段文字同时承担了「触发信号」「工作流摘要」「边界声明」三重职责。

## Body 的指令编写

:c-image-with-thumbnail{alt="Body 的指令编写" src="https://rte.weiyun.baidu.com/wiki/attach/image/api/imageDownloadAddress?attachId=ff8242b497ba43f98dec2b4b5a49b189&docGuid=l2M_9arzAdFq57"}

正文（Body）写作的几条通用原则：

- **命令式语气**：对模型下达指令，而不是「建议」「可能」。
- **强约束前置**：把「必须/禁止」类红线放在最前的 "强制要求" 区，便于模型不遗漏。
- **流程化分步**：把复杂任务拆成编号步骤，每步有明确输入/动作/产出。
- **给出示例**：一个正面示例胜过十行抽象描述；必要时同时给反例。
- **避免歧义**：少用"合理""适当""尽量"，多用可验证的判据。

## Body 形态一：知识文档型

:c-image-with-thumbnail{alt="Body 形态一：知识文档型" src="https://rte.weiyun.baidu.com/wiki/attach/image/api/imageDownloadAddress?attachId=3cb7917fe9854b56977379c038ce1dfe&docGuid=l2M_9arzAdFq57"}

**知识文档型** Skill 本质是「把领域 Know-How 文档化」：

- 典型场景：API 使用规范、协议字段说明、公司内部平台操作手册。
- 结构以「概念 → 字段 → 用法 → 常见坑」为主，模型读完即可回答问题或生成代码。
- 关键是**结构化**：清晰的目录层级让模型能快速定位需要的那一段。

## Body 形态二：工作流型

:c-image-with-thumbnail{alt="Body 形态二：工作流型" src="https://rte.weiyun.baidu.com/wiki/attach/image/api/imageDownloadAddress?attachId=2057bc64dbef459790d7d21558a0d35c&docGuid=l2M_9arzAdFq57"}

**工作流型** Skill 是「把一条操作链固化为 SOP」：

- 典型场景：发布流程、代码评审、E2E 测试编写、安全修复。
- 结构以「识别任务 → 准备 → 执行步骤 → 验收 → 输出格式」为主。
- 工作流型特别需要**幂等性**与**可中断性**：每一步能被验证，出错能在当前步骤恢复而非重来。

> 知识文档型 + 工作流型可以混合：用工作流驱动执行，用知识文档作为 `references/` 按需查阅。

## Body 实例：TS 严格迁移 Prompt 的改进前后

:c-image-with-thumbnail{alt="TS 严格迁移 Prompt 改进前后" src="https://rte.weiyun.baidu.com/wiki/attach/image/api/imageDownloadAddress?attachId=b7b28031bdd64f72bf0205b0f5427851&docGuid=l2M_9arzAdFq57"}

通过「改进前 vs 改进后」的对比可以看出 Body 打磨的方向：

- **改进前**：模糊陈述目标，例如"把项目迁移到严格模式，处理类型错误"。
- **改进后**：给出可执行的步骤、明确 any/unknown 的使用边界、列出常见错误修复模板、要求最小化 diff 并禁止关闭规则。

**结论**：Body 写得越具体、越可验证，产出质量方差越小。

## 脚本自动化——职责边界

**核心边界总结：**

确定性的多分支系统操作、复杂的格式配置，一次性封装成脚本。

哪些无法用脚本解决？需要引入用户决策的、需要引入 Agent 智能化思考的部分。

:c-image-with-thumbnail{alt="脚本自动化职责边界" src="https://rte.weiyun.baidu.com/wiki/attach/image/api/imageDownloadAddress?attachId=aff50f89e2924665bec86b1e7e35233e&docGuid=l2M_9arzAdFq57"}

**Skill vs 脚本** 的职责划分是开发时最容易踩坑的地方：

- **脚本擅长**：确定性强、分支多、格式严苛、重复执行——例如解析配置、批量替换、环境检查、报告生成。
- **Agent 擅长**：需要上下文判断、自然语言理解、代码设计决策——例如「这段代码该不该重构」「用户意图到底是什么」。
- **边界原则**：能脚本化的操作一定脚本化，交给 `scripts/` 调用；**禁止**让模型自己现写本该被脚本固化的流程（会漂移）。

好的 Skill = 稳定脚本（肌肉记忆）+ 聪明 Agent（临场判断）。

## 进阶：渐进式加载的两种模式

:c-image-with-thumbnail{alt="渐进式加载的两种模式" src="https://rte.weiyun.baidu.com/wiki/attach/image/api/imageDownloadAddress?attachId=6969926824b54ecdb834329d8b40c1b6&docGuid=l2M_9arzAdFq57"}

Skill 命中之后，内部还存在两级渐进式加载：

- **模式 A：文档按需加载**。`SKILL.md` 主体只写总览与流程，复杂知识（API 大全、长示例集）放在 `references/foo.md`，在流程里用指令"需要 X 时读取 `references/foo.md`"。
- **模式 B：脚本按需调用**。把确定性逻辑封装进 `scripts/*.sh`，Body 里通过命令调用而不是把实现写进 prompt。

两种模式都指向同一个目标：**正文保持最小可用集，其他知识随用随取**，避免一次性污染上下文。

## Skill 评测

:c-image-with-thumbnail{alt="Skill 评测" src="https://rte.weiyun.baidu.com/wiki/attach/image/api/imageDownloadAddress?attachId=f80a29a5c89a476096f4887936cefad8&docGuid=l2M_9arzAdFq57"}

Skill 写完 ≠ 写好。必须通过评测验证其有效性，关键维度：

- **激活准确性**：正例能命中吗？负例会误触吗？
- **执行成功率**：在命中的前提下，任务能稳定完成吗？
- **输出稳定性**：多次重跑产出是否一致、是否符合规范？
- **Token 效率**：Body 中有没有可以挪到 references 的冗余？

## 评测原则

:c-image-with-thumbnail{alt="评测原则" src="https://rte.weiyun.baidu.com/wiki/attach/image/api/imageDownloadAddress?attachId=306a683c41a844288515a20ae088a22c&docGuid=l2M_9arzAdFq57"}

几条务实的评测原则：

1. **先评激活，再评执行。** 激活不准，后面都白搭。
2. **批量而非单点。** 一组 10~30 个代表性样本跑一轮，看通过率和方差，而不是人工看一次就过。
3. **版本化迭代。** 每次改 Skill 都重跑同一套样本，量化对比。
4. **用真实语料。** 触发样本应来自用户真实请求，不要自己造。
5. **加入负例。** 刻意构造「看起来像但其实不是」的请求，检验边界清晰度。

---

## 完整 skill 示例

下面是一个「工作流型 + 脚本调用」融合形态的完整示例（`write-e2e-test`），可作为工程级模板参考。

````md
---
name: write-e2e-test
description: 根据用户需求在现有仓库中编写或修复 Playwright E2E 测试用例。仅当"从 0 新写用例"时，先应用 $plan-e2e-test 生成中文关键路径测试计划（根目录 Markdown）；若是"修复现有用例"，则不强制生成计划，直接定位失败点并修复。用户提出"写 Playwright 用例""补 E2E 测试""修复失败或 flaky 用例""根据页面流程落测试"时使用。
---

# Playwright 用例编写/修复

## 强制要求

1. 先判断任务类型：`从 0 新写用例` 或 `修复现有用例`。
2. 仅在"从 0 新写用例"时，必须先应用 `$plan-e2e-test` 生成中文测试计划 Markdown。
3. 不论新写还是修复，都要先定位代码范围，再改动代码。
4. 先执行 `playwright --help` 获取可用命令；若本地无全局 `playwright`，使用仓库等价命令执行同样的 `--help`。
5. 必须读取 `.env` 中的 `E2E_BASE_URL` 并实际访问页面观察真实行为，再编写或修复测试。
6. 测试执行采用"直到成功为止"的循环；若连续失败达到 5 次，立即停止并提醒用户人工排查。

## 执行流程

### 1. 识别任务类型（新写 / 修复）

- 从用户描述判断是"新增测试"还是"修复已有测试失败"。
- 若存在现成 spec 且目标是恢复通过率，归类为"修复"。
- 若不存在对应 spec 或用户明确要求新增覆盖，归类为"新写"。

### 2. （仅新写）先应用 `plan-e2e-test` 生成计划

- 仅"从 0 新写用例"时执行 `$plan-e2e-test`。
- 先在仓库根目录生成中文计划，再进入实现阶段。
- 用例优先覆盖计划中的 P0/P1 关键路径。

### 3. 根据用户输入定位业务源码范围（不是先找测试用例）

- 从用户描述中提取业务关键词、页面关键词、交互动作关键词。
- 优先在业务源码目录定位（`packages/chat-*/src`），排除 `packages/chat-e2e/**`。
- 先确认"功能实现位置"，再到 `packages/chat-e2e` 中映射对应 E2E 用例与页面对象。
- 使用 `rg` 缩小范围，避免全仓无关改动。示例：

```bash
rg -n "关键词1|关键词2|关键词3" packages --glob '!chat-e2e/**'
```

### 4. 获取 Playwright CLI 可用命令（必须执行）

先尝试全局命令：

```bash
playwright --help
```

若失败（例如 `command not found`），改用仓库命令（本项目推荐）：

```bash
pnpm --filter @baidu/chat-e2e exec playwright --help
```

根据 `--help` 输出选择具体子命令，如 `open`、`codegen`、`test`、`show-report`。

### 5. 读取 `.env` 并访问 `E2E_BASE_URL`

读取变量：

```bash
E2E_BASE_URL="$(awk -F= '/^[[:space:]]*E2E_BASE_URL[[:space:]]*=/{gsub(/^[[:space:]]+|[[:space:]]+$/, "", $2); print $2; exit}' .env)"
test -n "$E2E_BASE_URL"
```

访问并观察真实页面（优先覆盖用户提到的流程入口）：

```bash
pnpm --filter @baidu/chat-e2e exec playwright open "$E2E_BASE_URL/search"
```

需要辅助生成交互脚本时可使用：

```bash
pnpm --filter @baidu/chat-e2e run codegen
```

### 6. 编写或修复测试代码

- 若失败根因在业务实现，先修源码，再修或补测试。
- 若是"新写"，按测试计划的 P0/P1 关键路径实现，不扩散到细枝末节。
- 若是"修复"，围绕失败点和回归风险最小化改动，不强制补齐完整测试计划。
- 复用现有 `fixtures`、`ChatPage`、常量与断言风格。
- 禁止用 `waitForTimeout` 作为主同步手段，优先使用可观测信号（URL、响应、元素状态）。
- 只改与需求范围相关的最小文件集合。

### 7. 验收：稳定性验证

用例编写完成后，必须通过 `--repeat-each` 验证稳定性，**不使用外部重试脚本**。

#### 基础验证（并发）

```bash
pnpm --filter @baidu/chat-e2e exec playwright test src/pc/input/sug.spec.ts --repeat-each=10
```

#### 隔离验证（串行）

若测试涉及**有状态的增删改查流程**（典型例子：收藏→查看→验证→删除），**必须加 `--workers=1`**，否则并发执行会导致测试数据互相污染，造成虚假失败：

```bash
pnpm --filter @baidu/chat-e2e exec playwright test src/pc/collection/basic.spec.ts --repeat-each=10 --workers=1
```

#### 判断是否需要 `--workers=1` 的规则

| 场景                                     | 是否需要 `--workers=1` |
| ---------------------------------------- | ---------------------- |
| 只读操作（搜索、查看）                   | 否                     |
| 有状态流程（收藏、点赞、删除、表单提交） | **是**                 |
| 跨用例共享测试账号数据                   | **是**                 |
| 多个 case 操作同一资源                   | **是**                 |

#### 失败处理

若重复 10 次中出现失败，分析是代码问题还是环境问题。连续失败无法修复时，停止并提醒用户人工排查（重点检查：环境可达性、测试数据、页面改版、断言预期与网络依赖）。

## 输出要求

- 若为"新写"任务：先给出 `$plan-e2e-test` 产出的测试计划文件路径，并说明覆盖了哪些关键路径。
- 若为"修复"任务：说明定位到的失败点与修复策略，不要求先给测试计划文件。
- 先说明业务源码定位结果（文件列表 + 选择原因），再说明测试文件定位结果。
- 说明用哪个 `playwright --help` 命令拿到可用子命令。
- 说明 `.env` 中读取到的 `E2E_BASE_URL`（可脱敏域名中的敏感参数）。
- 说明稳定性验证采用的命令（是否加了 `--workers=1`，以及原因）。
````

---

## 总结

开发一个好用的 Skill，本质上就是回答四个问题：

1. **什么时候该我上场？** —— 精炼的 `description`。
2. **上场之后怎么做？** —— 强约束 + 流程化 Body。
3. **哪些细节别占上下文？** —— 脚本化 + references 渐进加载。
4. **怎么知道我写得好？** —— 批量评测 + 版本化迭代。

把握住**渐进式披露**这条主线，Skill 就能在"能力强"与"不臃肿"之间取得平衡，成为 Agent 工程里真正可复用的资产。
