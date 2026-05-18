---
title: 'OpenClaw 架构解析'
description: 'OpenClaw（开源 Claude Code 类智能体）的整体架构、网关与 Lane、智能体运行器、记忆系统、Computer Use 与代理机制'
querys: ['openclaw', 'agent', 'llm', '智能体']
---

## OpenClaw 架构解析

OpenClaw 是一套面向多渠道接入的智能体（Agent）运行框架，核心能力覆盖：多渠道消息接入、网关调度、智能体执行循环、记忆系统、Computer Use（让模型操作电脑）以及 API 代理。本篇梳理其整体架构与关键模块。

### 概述

#### 多渠道接入

OpenClaw 的上游接入层并不绑定某一种 IM 平台，而是把消息渠道作为可插拔的适配器：

- Telegram
- Slack
- WhatsApp
- Feishu（飞书）
- ……

![](/img/articles/rte/ede886de581f40f3acef2f12fe000ddb.webp)

![](/img/articles/rte/ab178f8ee21a4ac8aa484c1fad39cd93.webp)

### 整体流程

从一条用户消息进入系统到产出最终响应，涉及「渠道适配 → 网关 → 智能体运行器 → 模型/工具调用 → 响应」多个阶段。

![](/img/articles/rte/1d735e34541b43c9ade9c63d1a6150e8.webp)

![](/img/articles/rte/30eeadea948c4f66bfc5c307af6ad56f.webp)

#### 语音输入

- **Whisper**：OpenAI 的语音转文字模型，负责把用户的语音消息转换为文本后再进入后续的智能体流程。

![](/img/articles/rte/672eb8cc0f4f4238a8064659af1444d2.webp)

#### 通信协议

- **RPC 服务器**：Remote Procedure Call，允许客户端远程调用网关上暴露的方法，是内部组件互通的主通道
- **WebSocket 协议**：全双工、低延迟，适合实时对话、流式消息推送等场景

![](/img/articles/rte/acac481d0eaf4253b11dddb0d4c6f41c.webp)

#### API 健康态

- 当某个上游 API 不可用时，该 API 会被标记为 **冷却状态（cooldown）**，在冷却期内请求会被跳过或路由到备用模型，避免级联故障

![](/img/articles/rte/c99353f5c0d445818af6fc2e382973a3.webp)

![](/img/articles/rte/6eae01a454bd442fa63c1724a60171e2.webp)

![](/img/articles/rte/c4a3d57cd1f740518e9205bc0aea0353.webp)

### 网关与 Lane

网关在 OpenClaw 中承担「任务调度器」的角色，通过 **Lane（泳道）** 机制将不同优先级的任务隔离执行。

![](/img/articles/rte/a12a46f3321d4f2aa51491adfcfe05bc.webp)

- **高优先级交互不会被低优先级任务阻塞**：高优任务独占 Lane，避免被长耗时后台任务抢占
- **串行 vs 并行的权衡**：OpenClaw 大多数任务是串行执行的，只在明确需要的地方才开启并行

![](/img/articles/rte/e4e6a2e5d9dd4005a1f930f4dd89d6b6.webp)

- **Cognition 公司的设计哲学**：保持默认串行，只在必要处显式并行。这能显著降低状态同步、工具调用冲突、上下文污染等问题的出现概率

![](/img/articles/rte/01393d3e230a48768733994c38b2edec.webp)

### 智能体运行器的工作流程

智能体运行器（Agent Runner）负责将「用户输入 + 模型 + 工具集 + 记忆」组合成一次完整的执行循环。

![](/img/articles/rte/84dbcf53e2c44de39fc1c4f4cf17bab5.webp)

#### 模型选择

- OpenClaw 根据 **用户的配置偏好、模型可用性、API Key 有效性** 三要素动态决策最终使用哪个模型
- 结合前面的冷却态机制，可实现平滑降级（如 Claude → GPT-4 → 本地模型）

![](/img/articles/rte/fb9179d61af74662a369a66ad2f1e52e.webp)

#### 技能（Skills / Tools）

- 技能即智能体可调用的工具，例如：发送邮件、查询数据库、文件操作、代码执行等
- 每个技能都以 Tool Schema 形式暴露给 LLM，由模型决定何时调用

![](/img/articles/rte/d932e32854ee4acd812fc25e514f3072.webp)

#### 智能体循环（Agent Loop）

- 核心是 LLM 与工具调用的交互循环：`LLM 推理 → 产出 tool_call → 工具执行 → 结果回填上下文 → 再次推理`，直到产出最终回复或达到步数上限

![](/img/articles/rte/263b00a5eefe4e08aecd9a5b7a93438b.webp)

### 记忆

OpenClaw 的记忆分为 **短期记忆（当前会话）** 和 **长期记忆（跨会话）** 两层，存储形态和检索策略各不相同。

- **jsonl 会话转录**：每行一个 JSON 事件，完整性高、可追溯
  - 优点：无损，可做事件回放与审计
  - 缺点：长对话会消耗大量 tokens —— 因此主要用于储存 **当前对话的短期记忆**
- **记忆文件**：使用 Markdown 持久化长期记忆，便于人工审阅与编辑

#### 检索方法

- **vector**：基于向量的语义检索，擅长语义相近但字面不同的场景
- **keywords**：基于关键词的精确匹配，擅长专有名词、代号
- **hybrid**：混合检索，常见配比为 `70% vector + 30% BM25`
  - 这个比例是社区经验值：纯向量容易漏掉精确匹配（如函数名、错误码），纯关键词又丢失语义，7:3 在多数 QA/代码搜索 benchmark 上表现最稳

![](/img/articles/rte/b4b4de8125904125b5c1730ad613ec7c.webp)

![](/img/articles/rte/e5c05456adf44eef97abdefb628a7df9.webp)

### Computer Use

Computer Use 是让模型通过「看屏幕 + 操作鼠标键盘」的方式直接驱动电脑执行任务，是 Anthropic 提出的一类 Agent 能力。

![](/img/articles/rte/9c0c55acd113457da584e97ccf67e186.webp)

![](/img/articles/rte/24bba1524f904d9693245b4f7702faa8.webp)

![Anthropic 的另一个产品](/img/articles/rte/5c5da9d954c744cf9af06b7a982dd825.webp 'Anthropic 的另一个产品')

![](/img/articles/rte/90d92936e139459987da82133764788e.webp)

![](/img/articles/rte/945ed6bb010a4cb686a91aa63ac1ae1d.webp)

![](/img/articles/rte/cfbfd3d468b84bceb743f7831ea80a51.webp)

### 代理

代理层负责 API 转发、鉴权透传与流量管控，是 OpenClaw 对接不同模型供应商的统一出口。

![](/img/articles/rte/a3e699276ed648a58ee479cc45b32483.webp)

![](/img/articles/rte/6ef0599ef2e9472d8a479e3d7e2c7f90.webp)

![](/img/articles/rte/bdd1b438d6bb488e85ff9fb9449f18ec.webp)

![](/img/articles/rte/e28a77d5cb934471bff60e13f0eacdf2.webp)
