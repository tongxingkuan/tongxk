# Shared 模块

这是一个共享的工具模块，为整个 workspace 提供通用的工具函数、组件创建工具和类型定义。

## 功能特性

### 🛠️ 工具函数

#### ID 生成工具

```typescript
import { createStringId, createNumberId, generateUUID } from 'shared'

// 创建字符串 ID
createStringId() // "1"
createStringId('user') // "user-1"

// 创建数字 ID
createNumberId() // 1

// 生成 UUID
generateUUID() // "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
```

#### DOM 操作工具

```typescript
import { isMobile, isDesktop, debounce, throttle } from 'shared'

// 设备检测
isMobile() // true/false
isDesktop() // true/false

// 防抖函数
const debouncedFn = debounce(() => console.log('debounced'), 300)

// 节流函数
const throttledFn = throttle(() => console.log('throttled'), 300)
```

#### URL 操作工具

```typescript
import { getQuery, setQuery, buildQueryString } from 'shared'

// 获取查询参数
getQuery('page', '1') // 获取 page 参数，默认值为 '1'

// 设置查询参数
setQuery('page', '2')

// 构建查询字符串
buildQueryString({ page: '1', size: '10' }) // "?page=1&size=10"
```

### 🧩 组件工具

#### 组件创建工具

```typescript
import { createComponent, required } from 'shared'

const MyComponent = createComponent(
  {
    props: {
      title: required,
      count: 0,
    },
    emits: ['click'],
  },
  (props, { emit }) => {
    return () => h('div', { onClick: () => emit('click') }, props.title)
  }
)
```

#### 路由创建工具

```typescript
import { newRoute, r, redirect } from 'shared'

// 创建路由
const route = newRoute('/home', '首页', HomeComponent)

// 使用别名
const route = r('/home', '首页', HomeComponent)

// 创建重定向
const redirectRoute = redirect('/old', '/new')
```

### 📝 类型定义

```typescript
import type { ComponentParams, Prettify, MaybeFn } from 'shared'

// 组件参数类型
interface MyComponentParams extends ComponentParams {
  props: {
    title: string
    count: number
  }
  emits: ['click', 'change']
}

// 工具类型
type MyType = Prettify<{ a: string; b: number }>
type OptionalFn = MaybeFn<string>
```

## 安装和使用

### 在 workspace 中使用

```bash
# 安装依赖
pnpm install

# 构建模块
pnpm build

# 开发模式
pnpm dev
```

### 在其他项目中导入

```typescript
// 导入所有功能
import * as shared from 'shared'

// 按需导入
import { createStringId, isMobile } from 'shared'

// 导入特定模块
import { createComponent } from 'shared/components'
import { debounce } from 'shared/utils'
import type { ComponentParams } from 'shared/types'
```

## 目录结构

```
src/
├── components/          # 组件相关工具
│   ├── create-component.ts
│   ├── router-helper.ts
│   └── index.ts
├── utils/              # 工具函数
│   ├── id.ts          # ID 生成工具
│   ├── dom.ts         # DOM 操作工具
│   ├── url.ts         # URL 操作工具
│   └── index.ts
├── types/              # 类型定义
│   └── index.ts
└── index.ts            # 主入口文件
```

## 构建输出

构建后会生成以下文件：

- `dist/index.js` - CommonJS 格式
- `dist/index.mjs` - ES 模块格式
- `dist/index.d.ts` - TypeScript 类型声明

## 开发指南

### 添加新的工具函数

1. 在 `src/utils/` 目录下创建新的工具文件
2. 在 `src/utils/index.ts` 中导出新函数
3. 更新文档和测试

### 添加新的组件工具

1. 在 `src/components/` 目录下创建新的组件工具文件
2. 在 `src/components/index.ts` 中导出新工具
3. 更新文档和测试

### 添加新的类型定义

1. 在 `src/types/index.ts` 中添加新的类型定义
2. 更新文档

## 注意事项

- 所有工具函数都应该是纯函数，避免副作用
- 组件工具应该与 Vue 3 兼容
- 类型定义应该严格且易于使用
- 保持向后兼容性
