# Shared 模块优化总结

## 🎯 优化目标

本次优化旨在重构 shared 模块，提升代码组织结构、增强公用方法的定义，并改善模块的可维护性和可扩展性。

## 📁 目录结构重构

### 优化前

```
packages/shared/
├── create-component.ts
├── id-helper.ts
├── router-helper.ts
├── shared.ts
├── typings.d.ts
└── package.json
```

### 优化后

```
packages/shared/
├── src/
│   ├── components/          # 组件相关工具
│   │   ├── create-component.ts
│   │   ├── router-helper.ts
│   │   └── index.ts
│   ├── utils/              # 工具函数
│   │   ├── id.ts          # ID 生成工具
│   │   ├── dom.ts         # DOM 操作工具
│   │   ├── url.ts         # URL 操作工具
│   │   └── index.ts
│   ├── types/              # 类型定义
│   │   └── index.ts
│   └── index.ts            # 主入口文件
├── dist/                   # 构建输出
├── examples/               # 使用示例
├── README.md              # 文档
├── rollup.config.mjs      # 构建配置
└── package.json
```

## 🚀 主要改进

### 1. 模块化组织

- **按功能分类**: 将工具函数按功能分为 ID、DOM、URL 等模块
- **清晰的层次结构**: 每个模块都有独立的入口文件和导出
- **易于扩展**: 新增功能时只需在对应模块中添加文件

### 2. 工具函数增强

#### ID 生成工具 (`src/utils/id.ts`)

```typescript
// 新增功能
export const resetId = (startValue = 0) => {
  id = startValue
}
export const generateUUID = (): string => {
  /* ... */
}
export const generateShortUUID = (): string => {
  /* ... */
}
```

#### DOM 操作工具 (`src/utils/dom.ts`)

```typescript
// 新增功能
export const getScreenWidth = (): number => {
  /* ... */
}
export const getViewportWidth = (): number => {
  /* ... */
}
export const isElementInViewport = (element: Element): boolean => {
  /* ... */
}
export const scrollToElement = (element: Element | string, options?: ScrollToOptions): void => {
  /* ... */
}
export const debounce = <T extends (...args: any[]) => any>(func: T, wait: number) => {
  /* ... */
}
export const throttle = <T extends (...args: any[]) => any>(func: T, limit: number) => {
  /* ... */
}
```

#### URL 操作工具 (`src/utils/url.ts`)

```typescript
// 新增功能
export const setQuery = (key: string, value: string, replace?: boolean): void => {
  /* ... */
}
export const removeQuery = (key: string, replace?: boolean): void => {
  /* ... */
}
export const clearQueries = (replace?: boolean): void => {
  /* ... */
}
export const buildQueryString = (params: Record<string, string>): string => {
  /* ... */
}
export const parseQueryString = (queryString: string): Record<string, string> => {
  /* ... */
}
export const isAbsoluteUrl = (url: string): boolean => {
  /* ... */
}
export const joinUrlPath = (base: string, path: string): string => {
  /* ... */
}
```

### 3. 类型定义优化

- **集中管理**: 所有类型定义集中在 `src/types/index.ts`
- **类型安全**: 增强了类型定义的严格性和准确性
- **易于维护**: 统一的类型定义便于维护和更新

### 4. 构建系统升级

- **Rollup 构建**: 使用 Rollup 替代简单的 TypeScript 编译
- **多格式输出**: 支持 CommonJS 和 ES 模块格式
- **类型声明**: 自动生成 TypeScript 类型声明文件
- **源码映射**: 提供源码映射便于调试

### 5. 包管理优化

```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.js"
    },
    "./components": {
      /* ... */
    },
    "./utils": {
      /* ... */
    },
    "./types": {
      /* ... */
    }
  }
}
```

## 📦 使用方式

### 完整导入

```typescript
import * as shared from 'shared'
```

### 按需导入

```typescript
import { createStringId, isMobile, debounce } from 'shared'
```

### 模块导入

```typescript
import { createComponent } from 'shared/components'
import { debounce } from 'shared/utils'
import type { ComponentParams } from 'shared/types'
```

## 🔧 开发工具

### 新增脚本

```json
{
  "scripts": {
    "build": "rollup -c",
    "dev": "rollup -c -w",
    "clean": "rimraf dist",
    "type-check": "tsc --noEmit",
    "lint": "eslint src --ext .ts,.tsx",
    "lint:fix": "eslint src --ext .ts,.tsx --fix"
  }
}
```

### 工作流集成

```json
{
  "scripts": {
    "shared": "pnpm --filter shared",
    "shared:build": "pnpm --filter shared build",
    "shared:dev": "pnpm --filter shared dev"
  }
}
```

## 📈 性能提升

1. **Tree Shaking**: 支持按需导入，减少打包体积
2. **类型安全**: 严格的 TypeScript 配置提升开发体验
3. **模块化**: 更好的代码分割和缓存策略
4. **构建优化**: Rollup 提供更高效的构建过程

## 🎉 总结

通过本次优化，shared 模块实现了：

- ✅ **更好的代码组织**: 清晰的目录结构和模块划分
- ✅ **增强的功能**: 新增多个实用的工具函数
- ✅ **类型安全**: 完善的 TypeScript 类型定义
- ✅ **现代化构建**: 使用 Rollup 构建系统
- ✅ **易于使用**: 灵活的导入方式和详细的文档
- ✅ **可维护性**: 模块化设计便于维护和扩展

这些改进为整个 workspace 提供了更强大、更易用的共享工具库，支持各个子项目的开发需求。
