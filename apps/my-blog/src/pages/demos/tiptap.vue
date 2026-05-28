<template>
  <Title>Tiptap 富文本编辑器</Title>
  <ClientOnly>
    <div class="tiptap-demo">
      <div class="intro">
        <h2>Tiptap 富文本编辑器</h2>
        <p>ProseMirror + Tiptap + tippy.js 实现，<b>选中任意文字即可弹出编辑菜单</b>。</p>
      </div>

      <div class="customize">
        <div class="cz-group">
          <span class="cz-label">气泡主题</span>
          <button
            v-for="t in themes"
            :key="t.value"
            class="cz-chip"
            :class="{ active: bubbleTheme === t.value }"
            @click="bubbleTheme = t.value"
          >
            {{ t.label }}
          </button>
        </div>
        <div class="cz-group">
          <span class="cz-label">菜单内容</span>
          <button
            v-for="v in variants"
            :key="v.value"
            class="cz-chip"
            :class="{ active: bubbleVariant === v.value }"
            @click="bubbleVariant = v.value"
          >
            {{ v.label }}
          </button>
        </div>
        <div class="cz-group">
          <span class="cz-label">边界</span>
          <button
            v-for="b in boundaries"
            :key="b.value"
            class="cz-chip"
            :class="{ active: boundaryKey === b.value }"
            @click="boundaryKey = b.value"
          >
            {{ b.label }}
          </button>
          <span class="cz-tip">⤷ 选区靠近边界时菜单会自动 flip 翻转</span>
        </div>
      </div>

      <div ref="wrapperRef" class="editor-wrapper">
        <div class="toolbar">
          <button
            v-for="btn in fixedToolbar"
            :key="btn.key"
            class="tb-btn"
            :class="{ active: editor && btn.isActive(editor) }"
            :disabled="!editor"
            @click="btn.run"
          >
            {{ btn.label }}
          </button>
        </div>

        <BubbleMenu
          v-if="editor"
          :key="`bm-${boundaryKey}`"
          :editor="editor"
          :tippy-options="tippyOptions"
          :should-show="shouldShowBubble"
          class="bubble-menu"
          :class="['theme-' + bubbleTheme, 'variant-' + bubbleVariant]"
        >
          <!-- 通过具名插槽支持完全自定义内容；默认渲染按当前 variant 切换 -->
          <slot name="bubble" :editor="editor">
            <template v-for="(item, idx) in currentBubbleItems" :key="item.key + '-' + idx">
              <span v-if="item.type === 'sep'" class="bb-sep" />
              <button
                v-else
                class="bb-btn"
                :class="{ active: item.isActive?.(editor) }"
                :title="item.title || item.label"
                @click="item.run"
              >
                <span v-if="item.icon" class="bb-icon">{{ item.icon }}</span>
                <span v-else>{{ item.label }}</span>
              </button>
            </template>
          </slot>
        </BubbleMenu>

        <EditorContent ref="contentRef" :editor="editor" class="editor-content" />
      </div>

      <div class="output">
        <div class="output-block">
          <div class="output-title">HTML</div>
          <pre class="output-pre">{{ html }}</pre>
        </div>
        <div class="output-block">
          <div class="output-title">JSON (ProseMirror Doc)</div>
          <pre class="output-pre">{{ json }}</pre>
        </div>
      </div>
    </div>

    <template #fallback>
      <div class="tiptap-demo">加载中…</div>
    </template>
  </ClientOnly>
</template>

<script setup lang="ts">
import { Editor, EditorContent, BubbleMenu } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import 'tippy.js/dist/tippy.css'

definePageMeta({
  layout: 'demo',
  pageTransition: { name: 'demos' },
})

const editor = shallowRef<Editor | null>(null)
const html = ref('')
const json = ref<any>(null)

// 自定义：气泡主题 / 内容变体 / tippy 边界
type ThemeKey = 'dark' | 'light' | 'colorful'
type VariantKey = 'full' | 'minimal' | 'markdown'
type BoundaryKey = 'wrapper' | 'content' | 'viewport'

const bubbleTheme = ref<ThemeKey>('dark')
const bubbleVariant = ref<VariantKey>('full')
const boundaryKey = ref<BoundaryKey>('wrapper')

const themes: { value: ThemeKey; label: string }[] = [
  { value: 'dark', label: '🌙 深色' },
  { value: 'light', label: '☀️ 浅色' },
  { value: 'colorful', label: '🎨 多彩' },
]
const variants: { value: VariantKey; label: string }[] = [
  { value: 'full', label: '完整' },
  { value: 'minimal', label: '精简' },
  { value: 'markdown', label: 'Markdown 风格' },
]
const boundaries: { value: BoundaryKey; label: string }[] = [
  { value: 'wrapper', label: '编辑器外框' },
  { value: 'content', label: '内容区域' },
  { value: 'viewport', label: '视口' },
]

const wrapperRef = ref<HTMLElement | null>(null)
const contentRef = ref<any>(null)

const getBoundaryEl = (): HTMLElement | 'clippingParents' => {
  if (boundaryKey.value === 'viewport') return 'clippingParents'
  if (boundaryKey.value === 'content') {
    // EditorContent 是组件，真实根节点在 .editor-content
    return (contentRef.value?.$el as HTMLElement) || wrapperRef.value!
  }
  return wrapperRef.value!
}

const initialContent = `
<h2>试试看 ✨</h2>
<p>这是一个基于 <strong>ProseMirror</strong> + <em>Tiptap</em> + <code>tippy.js</code> 的最小富文本编辑器。</p>
<p>用鼠标 <mark>划选任意文字</mark>，会在选区上方弹出编辑菜单：</p>
<ul>
  <li>加粗 / 斜体 / 删除线 / 行内代码</li>
  <li>插入或移除链接</li>
  <li>切换为标题、无序/有序列表</li>
</ul>
<blockquote>选区折叠或编辑器失焦时，菜单会自动消失。</blockquote>
<p>也可以在顶部固定工具栏里使用相同能力。</p>
`

onMounted(() => {
  editor.value = new Editor({
    content: initialContent,
    extensions: [StarterKit],
    onUpdate: ({ editor: ed }) => {
      html.value = ed.getHTML()
      json.value = ed.getJSON()
    },
    onCreate: ({ editor: ed }) => {
      html.value = ed.getHTML()
      json.value = ed.getJSON()
    },
  })
})

onBeforeUnmount(() => {
  editor.value?.destroy()
})

// 仅当存在非空文本选区时才显示气泡菜单
const shouldShowBubble = ({ editor: ed, from, to }: any) => {
  if (!ed?.isEditable) return false
  if (from === to) return false
  const text = ed.state.doc.textBetween(from, to, ' ').trim()
  return text.length > 0
}

// tippy 选项：暴露边界（preventOverflow + flip）以及主题，调用方可通过 ref 读 boundary
const tippyOptions = computed(() => {
  const boundary = getBoundaryEl()
  return {
    duration: 120,
    placement: 'top' as const,
    theme: `tiptap-${bubbleTheme.value}`,
    offset: [0, 8] as [number, number],
    // 让 bubble 直接挂到 boundary 上：popper 的 clipping context 与 boundary 一致，
    // 不会因为父级 transform / scroll 出现「定位漂移到 boundary 之外」的现象。
    // 注意：boundary 元素不能有 overflow:hidden，否则会裁掉 bubble。
    appendTo: () => (typeof boundary === 'string' ? document.body : (boundary as HTMLElement)) || document.body,
    maxWidth: 'none' as const,
    popperOptions: {
      // fixed 策略可避开父级 transform 引起的定位异常
      strategy: 'fixed' as const,
      modifiers: [
        {
          name: 'flip',
          options: {
            boundary,
            padding: 8,
            fallbackPlacements: ['bottom', 'top'],
            // 没有空间时也强制翻转，而不是固定在原始 placement
            flipVariations: false,
          },
        },
        {
          name: 'preventOverflow',
          options: {
            boundary,
            padding: 8,
            // 主轴 + 副轴都做 clamp，水平方向也不超
            mainAxis: true,
            altAxis: true,
            // 不"贴住"参考元素，宁可偏离 selection 也不越过 boundary
            tether: false,
          },
        },
      ],
    },
  }
})

const fixedToolbar = computed(() => [
  {
    key: 'bold',
    label: 'B',
    isActive: (ed: Editor) => ed.isActive('bold'),
    run: () => editor.value?.chain().focus().toggleBold().run(),
  },
  {
    key: 'italic',
    label: 'I',
    isActive: (ed: Editor) => ed.isActive('italic'),
    run: () => editor.value?.chain().focus().toggleItalic().run(),
  },
  {
    key: 'strike',
    label: 'S',
    isActive: (ed: Editor) => ed.isActive('strike'),
    run: () => editor.value?.chain().focus().toggleStrike().run(),
  },
  {
    key: 'code',
    label: '</>',
    isActive: (ed: Editor) => ed.isActive('code'),
    run: () => editor.value?.chain().focus().toggleCode().run(),
  },
  {
    key: 'h2',
    label: 'H2',
    isActive: (ed: Editor) => ed.isActive('heading', { level: 2 }),
    run: () => editor.value?.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    key: 'bullet',
    label: '• 列表',
    isActive: (ed: Editor) => ed.isActive('bulletList'),
    run: () => editor.value?.chain().focus().toggleBulletList().run(),
  },
  {
    key: 'ordered',
    label: '1. 列表',
    isActive: (ed: Editor) => ed.isActive('orderedList'),
    run: () => editor.value?.chain().focus().toggleOrderedList().run(),
  },
  {
    key: 'quote',
    label: '“”',
    isActive: (ed: Editor) => ed.isActive('blockquote'),
    run: () => editor.value?.chain().focus().toggleBlockquote().run(),
  },
  {
    key: 'undo',
    label: '↶',
    isActive: () => false,
    run: () => editor.value?.chain().focus().undo().run(),
  },
  {
    key: 'redo',
    label: '↷',
    isActive: () => false,
    run: () => editor.value?.chain().focus().redo().run(),
  },
])

// 气泡菜单内容：按 variant 动态切换；type:'sep' 表示分隔符
type BubbleItem =
  | { type: 'sep'; key: string }
  | {
      type?: 'btn'
      key: string
      label: string
      icon?: string
      title?: string
      isActive?: (ed: Editor) => boolean
      run: () => void
    }

const bubbleVariantsMap = computed<Record<VariantKey, BubbleItem[]>>(() => ({
  full: [
    {
      key: 'bold',
      label: 'B',
      title: '加粗',
      isActive: ed => ed.isActive('bold'),
      run: () => editor.value?.chain().focus().toggleBold().run(),
    },
    {
      key: 'italic',
      label: 'I',
      title: '斜体',
      isActive: ed => ed.isActive('italic'),
      run: () => editor.value?.chain().focus().toggleItalic().run(),
    },
    {
      key: 'strike',
      label: 'S',
      title: '删除线',
      isActive: ed => ed.isActive('strike'),
      run: () => editor.value?.chain().focus().toggleStrike().run(),
    },
    {
      key: 'code',
      label: '</>',
      title: '行内代码',
      isActive: ed => ed.isActive('code'),
      run: () => editor.value?.chain().focus().toggleCode().run(),
    },
    { type: 'sep', key: 's1' },
    {
      key: 'h2',
      label: 'H2',
      title: '二级标题',
      isActive: ed => ed.isActive('heading', { level: 2 }),
      run: () => editor.value?.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      key: 'bullet',
      icon: '•',
      title: '无序列表',
      isActive: ed => ed.isActive('bulletList'),
      run: () => editor.value?.chain().focus().toggleBulletList().run(),
      label: '',
    },
    {
      key: 'ordered',
      label: '1.',
      title: '有序列表',
      isActive: ed => ed.isActive('orderedList'),
      run: () => editor.value?.chain().focus().toggleOrderedList().run(),
    },
    {
      key: 'quote',
      icon: '“',
      title: '引用',
      isActive: ed => ed.isActive('blockquote'),
      run: () => editor.value?.chain().focus().toggleBlockquote().run(),
      label: '',
    },
  ],
  minimal: [
    {
      key: 'bold',
      label: 'B',
      title: '加粗',
      isActive: ed => ed.isActive('bold'),
      run: () => editor.value?.chain().focus().toggleBold().run(),
    },
    {
      key: 'italic',
      label: 'I',
      title: '斜体',
      isActive: ed => ed.isActive('italic'),
      run: () => editor.value?.chain().focus().toggleItalic().run(),
    },
    {
      key: 'code',
      label: '</>',
      title: '行内代码',
      isActive: ed => ed.isActive('code'),
      run: () => editor.value?.chain().focus().toggleCode().run(),
    },
  ],
  markdown: [
    {
      key: 'bold',
      icon: '**B**',
      title: '**加粗**',
      isActive: ed => ed.isActive('bold'),
      run: () => editor.value?.chain().focus().toggleBold().run(),
      label: '',
    },
    {
      key: 'italic',
      icon: '*I*',
      title: '*斜体*',
      isActive: ed => ed.isActive('italic'),
      run: () => editor.value?.chain().focus().toggleItalic().run(),
      label: '',
    },
    {
      key: 'strike',
      icon: '~~S~~',
      title: '~~删除线~~',
      isActive: ed => ed.isActive('strike'),
      run: () => editor.value?.chain().focus().toggleStrike().run(),
      label: '',
    },
    {
      key: 'code',
      icon: '`code`',
      title: '`行内代码`',
      isActive: ed => ed.isActive('code'),
      run: () => editor.value?.chain().focus().toggleCode().run(),
      label: '',
    },
    { type: 'sep', key: 's1' },
    {
      key: 'h2',
      icon: '## H2',
      title: '## 标题',
      isActive: ed => ed.isActive('heading', { level: 2 }),
      run: () => editor.value?.chain().focus().toggleHeading({ level: 2 }).run(),
      label: '',
    },
    {
      key: 'quote',
      icon: '> 引',
      title: '> 引用',
      isActive: ed => ed.isActive('blockquote'),
      run: () => editor.value?.chain().focus().toggleBlockquote().run(),
      label: '',
    },
  ],
}))

const currentBubbleItems = computed(() => bubbleVariantsMap.value[bubbleVariant.value])
</script>

<style lang="less" scoped>
.tiptap-demo {
  max-width: 960px;
  margin: 0 auto;
  padding: 24px 32px 64px;
}

.intro {
  margin-bottom: 20px;

  h2 {
    margin: 0 0 8px;
    font-size: 22px;
    font-weight: 600;
    color: #333;
  }

  p {
    margin: 0;
    font-size: 14px;
    color: #666;
  }
}

.editor-wrapper {
  position: relative;
  background: #fff;
  border: 1px solid rgba(230, 162, 60, 0.25);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
  // 不能用 overflow: hidden —— 否则 BubbleMenu 会被外框裁掉，
  // 改用内部元素自带 border-radius 的方式做圆角
}

.customize {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 24px;
  padding: 12px 14px;
  margin-bottom: 12px;
  background: #fff;
  border: 1px dashed rgba(230, 162, 60, 0.4);
  border-radius: 10px;

  .cz-group {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
  }

  .cz-label {
    font-size: 12px;
    color: #888;
    margin-right: 4px;
  }

  .cz-tip {
    font-size: 12px;
    color: #aaa;
    margin-left: 6px;
  }

  .cz-chip {
    padding: 4px 10px;
    font-size: 12px;
    border: 1px solid rgba(0, 0, 0, 0.08);
    background: #fff;
    color: #555;
    border-radius: 14px;
    cursor: pointer;
    transition: all 0.18s ease;

    &:hover {
      border-color: #e6a23c;
      color: #e6a23c;
    }

    &.active {
      background: #e6a23c;
      border-color: #e6a23c;
      color: #fff;
    }
  }
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 10px 14px;
  background: linear-gradient(135deg, rgba(230, 162, 60, 0.06), rgba(245, 108, 108, 0.06));
  border-bottom: 1px solid rgba(230, 162, 60, 0.15);
  border-radius: 12px 12px 0 0;
}

.tb-btn {
  min-width: 32px;
  height: 30px;
  padding: 0 10px;
  font-size: 13px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: #fff;
  color: #444;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.18s ease;

  &:hover:not(:disabled) {
    border-color: #e6a23c;
    color: #e6a23c;
  }

  &.active {
    background: #e6a23c;
    border-color: #e6a23c;
    color: #fff;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.editor-content {
  padding: 16px 20px;
  min-height: 280px;
  border-radius: 0 0 12px 12px;

  :deep(.ProseMirror) {
    outline: none;
    line-height: 1.7;
    color: #303133;
    font-size: 15px;

    h1,
    h2,
    h3 {
      margin: 0.6em 0 0.4em;
      font-weight: 600;
      color: #222;
    }

    p {
      margin: 0.4em 0;
    }

    ul,
    ol {
      padding-left: 1.4em;
      margin: 0.4em 0;
    }

    blockquote {
      border-left: 3px solid #e6a23c;
      padding: 4px 12px;
      margin: 0.6em 0;
      color: #666;
      background: rgba(230, 162, 60, 0.06);
    }

    code {
      background: rgba(0, 0, 0, 0.06);
      padding: 1px 6px;
      border-radius: 4px;
      font-family: 'JetBrains Mono', Menlo, Consolas, monospace;
      font-size: 13px;
    }

    pre {
      background: #1f2937;
      color: #f9fafb;
      padding: 12px 14px;
      border-radius: 8px;
      overflow: auto;

      code {
        background: transparent;
        padding: 0;
        color: inherit;
      }
    }

    a {
      color: #409eff;
      text-decoration: underline;
    }

    mark {
      background: #fff2a8;
      padding: 0 2px;
    }
  }
}

.bubble-menu {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px;
  border-radius: 8px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.18);
  // 默认（深色）
  background: rgba(35, 35, 35, 0.95);

  &.theme-dark {
    background: rgba(35, 35, 35, 0.95);

    .bb-btn {
      color: #f5f5f5;
    }

    .bb-btn:hover {
      background: rgba(255, 255, 255, 0.12);
    }

    .bb-sep {
      background: rgba(255, 255, 255, 0.18);
    }
  }

  &.theme-light {
    background: #fff;
    border: 1px solid rgba(0, 0, 0, 0.08);

    .bb-btn {
      color: #333;
    }

    .bb-btn:hover {
      background: rgba(0, 0, 0, 0.06);
    }

    .bb-sep {
      background: rgba(0, 0, 0, 0.1);
    }
  }

  &.theme-colorful {
    background: linear-gradient(135deg, #f56c6c 0%, #e6a23c 50%, #67c23a 100%);
    box-shadow: 0 8px 24px rgba(230, 162, 60, 0.35);

    .bb-btn {
      color: #fff;
    }

    .bb-btn:hover {
      background: rgba(255, 255, 255, 0.22);
    }

    .bb-sep {
      background: rgba(255, 255, 255, 0.4);
    }
  }

  &.variant-markdown {
    .bb-btn {
      font-family: 'JetBrains Mono', Menlo, Consolas, monospace;
      font-size: 11px;
      padding: 0 6px;
    }
  }

  &.variant-minimal {
    padding: 4px;
    gap: 2px;
  }
}

.bb-btn {
  min-width: 28px;
  height: 26px;
  padding: 0 8px;
  font-size: 12px;
  font-weight: 600;
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;

  &.active {
    background: #e6a23c;
    color: #fff !important;
  }
}

.bb-sep {
  width: 1px;
  height: 16px;
  background: rgba(255, 255, 255, 0.18);
  margin: 0 2px;
}

.output {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 20px;
}

.output-block {
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 10px;
  overflow: hidden;
}

.output-title {
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 500;
  color: #555;
  background: #f7f7f8;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.output-pre {
  margin: 0;
  padding: 12px 14px;
  max-height: 240px;
  overflow: auto;
  font-size: 12px;
  line-height: 1.55;
  font-family: 'JetBrains Mono', Menlo, Consolas, monospace;
  color: #333;
  white-space: pre-wrap;
  word-break: break-word;
}

@media (max-width: 768px) {
  .tiptap-demo {
    padding: 16px;
  }

  .output {
    grid-template-columns: 1fr;
  }
}
</style>
