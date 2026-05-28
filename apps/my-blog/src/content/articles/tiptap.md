---
title: 'Tiptap 与 ProseMirror：富文本编辑器底层解读'
description: 'ProseMirror 的核心模型（Schema/State/Transaction/View）、Tiptap 在其上的封装、扩展机制、协同与常见落地坑'
querys: ['tiptap', 'prosemirror', '富文本编辑器', 'editor', 'schema', 'transaction', '协同编辑']
---

## Tiptap 与 ProseMirror：富文本编辑器底层解读

富文本编辑器在浏览器里一直是难题。`contenteditable` 行为不一致、HTML 结构难约束、撤销栈不可控、协同冲突难处理。ProseMirror 把这一切重做了一遍：用**强 schema + 不可变状态 + 显式事务**取代浏览器原生的可编辑 DOM。Tiptap 则是在 ProseMirror 上做的「框架友好封装」，让你不用直接面对底层 API 也能拿到全部能力。

本文按「ProseMirror 是什么 → Tiptap 加了什么 → 怎么扩展 → 协同 → 落地坑」的顺序展开。

### 为什么不用 contenteditable + execCommand

浏览器原生方案的问题：

- **HTML 不受控**：用户粘贴一段 Word 文档，立刻引入一堆奇怪标签和内联样式
- **execCommand 已废弃**：行为各浏览器不一致，无标准、无 polyfill
- **撤销栈黑盒**：浏览器自己管，无法和应用状态合并
- **没有结构化 Selection**：只有 DOM Range，跨节点操作极难写
- **协同几乎不可能**：基于 DOM diff 的 OT/CRDT 噪音太多

ProseMirror 的思路是：**DOM 只是渲染产物，真正的编辑状态用一棵自己的文档树表示**。所有改动通过事务（Transaction）施加到状态上，再由 View 层做最小化 DOM patch。

### ProseMirror 的四大核心

ProseMirror 拆成几个独立的包，组合使用：

- `prosemirror-model`：文档模型（Schema、Node、Mark、Fragment）
- `prosemirror-state`：编辑器状态（EditorState、Transaction、Selection、Plugin）
- `prosemirror-view`：把 state 渲染到 DOM、处理 DOM 事件
- `prosemirror-transform`：把对文档的修改抽象成可组合、可反演的 Step
- `prosemirror-commands` / `prosemirror-keymap` / `prosemirror-history` 等周边

#### Schema：文档结构的"类型系统"

Schema 强约束哪些节点可以嵌套哪些节点、哪些 Mark 可以应用到哪些节点。这是 ProseMirror 区别于其他编辑器的根基。

```ts
import { Schema } from 'prosemirror-model'

const schema = new Schema({
  nodes: {
    doc: { content: 'block+' },
    paragraph: {
      content: 'inline*',
      group: 'block',
      toDOM: () => ['p', 0],
      parseDOM: [{ tag: 'p' }],
    },
    text: { group: 'inline' },
  },
  marks: {
    bold: {
      toDOM: () => ['strong', 0],
      parseDOM: [{ tag: 'strong' }, { tag: 'b' }],
    },
  },
})
```

`content: 'block+'` 表示 doc 必须由一个或多个 block 组成。任何不符合 schema 的操作都会被事务拒绝 —— 这就是为什么 ProseMirror 文档结构永远干净。

`toDOM` 用于渲染、`parseDOM` 用于把外部 HTML 反序列化进文档（粘贴、初始化）。两者必须互逆，否则粘贴就会丢内容。

#### State：不可变的编辑状态

```ts
import { EditorState } from 'prosemirror-state'

const state = EditorState.create({ schema })
// state.doc       —— 当前文档
// state.selection —— 当前选区（TextSelection / NodeSelection / 自定义）
// state.plugins   —— 装载的插件
```

EditorState 是不可变对象。每次修改产生新 state，旧 state 仍然有效（这就是为什么协同/历史/时间旅行都好做）。

#### Transaction：所有修改的唯一入口

修改文档不能直接 mutate，必须通过 Transaction：

```ts
const tr = state.tr.insertText('hello', 1).addMark(1, 6, schema.marks.bold.create())

const newState = state.apply(tr)
view.updateState(newState)
```

Transaction 是若干 Step 的序列。每个 Step 可被反演（用于撤销）、可被映射（用于协同变换）、可被序列化（用于网络传输）。这是 ProseMirror 协同能力的基础。

#### View：state ↔ DOM 的桥梁

```ts
import { EditorView } from 'prosemirror-view'

const view = new EditorView(document.querySelector('#editor'), {
  state,
  dispatchTransaction(tr) {
    const next = view.state.apply(tr)
    view.updateState(next)
  },
})
```

View 干两件事：

1. 监听 DOM 事件（输入、粘贴、拖拽、IME），把它们转成 Transaction
2. 拿到新 state 后，diff 出最小 DOM 改动并 patch

中间还要处理 IME 合成、选区映射、装饰（Decoration）等细节，是 ProseMirror 最复杂的一块。

### Tiptap 在 ProseMirror 上加了什么

ProseMirror 直接用很重：每个节点要写 schema、parseDOM、toDOM、命令、键位、菜单……Tiptap 的核心价值是把这些打包成「Extension」，并提供框架适配（React/Vue/Svelte/原生）。

#### Extension = Node + Mark + Plugin + Commands + Keymap

一个加粗扩展在 Tiptap 里长这样：

```ts
import { Mark, mergeAttributes } from '@tiptap/core'

export const Bold = Mark.create({
  name: 'bold',
  parseHTML() {
    return [{ tag: 'strong' }, { tag: 'b' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['strong', mergeAttributes(HTMLAttributes), 0]
  },
  addCommands() {
    return {
      toggleBold:
        () =>
        ({ commands }) =>
          commands.toggleMark('bold'),
    }
  },
  addKeyboardShortcuts() {
    return { 'Mod-b': () => this.editor.commands.toggleBold() }
  },
})
```

对比直接写 ProseMirror，Tiptap 帮你处理了：

- **schema 合并**：所有 extension 的 nodes/marks 自动汇总成最终 schema
- **命令链**：`editor.chain().focus().toggleBold().setColor('red').run()`，而不是手动拼 transaction
- **响应式状态**：`editor.isActive('bold')`、selection 变化触发 Vue/React 重渲染
- **Input/Paste Rules**：`**xxx**` 自动转粗体、URL 自动转链接，这些在 PM 里要自己写 plugin

#### 用 Tiptap 创建一个编辑器

```ts
import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'

const editor = new Editor({
  element: document.querySelector('.editor'),
  extensions: [StarterKit, Image],
  content: '<p>Hello <strong>world</strong></p>',
  onUpdate({ editor }) {
    console.log(editor.getHTML())
  },
})
```

`StarterKit` 打包了段落、标题、列表、加粗、斜体、撤销/重做等常用扩展。

### 自定义节点：实战要点

写自定义节点时，**一定先想清楚 schema**，再考虑 UI。常见结构：

```ts
import { Node, mergeAttributes } from '@tiptap/core'

export const Callout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'block+', // 内部仍然是块结构，可嵌段落/列表
  defining: true, // 粘贴/合并时不会被外层吃掉
  addAttributes() {
    return {
      type: {
        default: 'info',
        parseHTML: el => el.getAttribute('data-type'),
        renderHTML: attrs => ({ 'data-type': attrs.type }),
      },
    }
  },
  parseHTML() {
    return [{ tag: 'div[data-callout]' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes({ 'data-callout': '' }, HTMLAttributes), 0]
  },
})
```

几个容易踩的属性：

- **`content`**：决定能装什么子节点。写 `'inline*'` 是行内容器、`'block+'` 是块容器；写错会导致命令报"can't fit"
- **`defining`**：跨节点退格、粘贴时是否保护边界
- **`atom`**：节点是否被视为「原子」，原子节点内部不可编辑（适合卡片、嵌入）
- **`isolating`**：选区不能跨出节点边界（适合表格单元格）

#### NodeView：要复杂交互时再用

如果节点需要 React/Vue 组件渲染（如可拖拽图片、嵌入视频、@mention 卡片），用 NodeView：

```ts
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import CalloutComponent from './Callout.vue'

export const Callout = Node.create({
  // ...同上
  addNodeView() {
    return VueNodeViewRenderer(CalloutComponent)
  },
})
```

NodeView 内部访问 `node.attrs`、调 `updateAttributes()` 改属性、用 `<NodeViewContent />` 渲染子内容。**编辑区域必须是 `<NodeViewContent />` 包裹的 DOM**，否则 ProseMirror 接管不了输入事件。

### 协同编辑：Y.js + ProseMirror

ProseMirror 的 Step 模型让协同有两条路：

1. **OT**：基于 Step 的位置映射（官方 `prosemirror-collab` 走这条），需要中央服务器仲裁
2. **CRDT**：用 Y.js 等 CRDT 库托管文档，去中心化、无需服务器仲裁

Tiptap 官方推荐 Y.js 路线：

```ts
import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'

const ydoc = new Y.Doc()
const provider = new WebsocketProvider('wss://your.server', 'doc-id', ydoc)

const editor = new Editor({
  extensions: [
    StarterKit.configure({ history: false }), // CRDT 自带历史
    Collaboration.configure({ document: ydoc }),
    CollaborationCursor.configure({
      provider,
      user: { name: 'Alice', color: '#f783ac' },
    }),
  ],
})
```

要点：

- **关闭原生 history**：CRDT 用 `Y.UndoManager`，否则两套撤销栈会打架
- **schema 必须所有客户端一致**：否则一端产生的节点在另一端会被 schema 拒绝，文档崩溃
- **离线优先**：Y.js 天然支持离线编辑、重连合并，不需要额外冲突处理
- **awareness（光标/选区/在线状态）走单独的轻量通道**，不进文档历史

### 常见落地坑

- **粘贴 Word/Notion 内容样式爆炸**：必须配 `transformPastedHTML` 或 `clipboardTextParser` 过滤 inline style，只保留 schema 允许的节点和 mark
- **图片上传**：编辑器里只能放本地 URL/base64 占位，等上传完成再用事务替换 src。期间要标记节点为 uploading 状态，禁止序列化未完成的内容
- **撤销栈污染**：远端协同操作不应进本地历史；上传过程中的占位替换也要用 `tr.setMeta('addToHistory', false)` 跳过
- **大文档性能**：超长文档（1w+ 节点）渲染卡顿，可以用 `decorations` 实现虚拟滚动，或拆分成多个独立编辑器
- **IME 中文输入**：自定义 keymap 时要避开 composition 阶段，否则会吃字。Tiptap 内置已处理大部分场景，**自己写 plugin 时要判断 `event.isComposing`**
- **SSR**：Tiptap/PM 依赖 DOM，Nuxt/Next 里要用 `client-only` 包裹或动态 import

### 选型小结

- **极端定制 / 长期演进**：直接 ProseMirror，掌控力最强，学习曲线陡
- **业务编辑器（评论、文档、知识库）**：Tiptap，开发效率高、生态完备
- **结构化数据为主（表单、配置面板）**：Slate.js、Lexical 也值得对比
- **简单富文本（粗体、链接、列表）**：CKEditor / Quill 也够用，PM/Tiptap 是「重武器」

记住一点：**富文本编辑器的复杂度不在 UI，而在 schema 设计和事务一致性**。先把数据模型想清楚，再写界面，能避开 80% 的坑。
