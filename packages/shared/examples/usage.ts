/**
 * Shared 模块使用示例
 */

// 导入工具函数
import {
  createStringId,
  createNumberId,
  generateUUID,
  isMobile,
  isDesktop,
  debounce,
  throttle,
  getQuery,
  setQuery,
  buildQueryString,
} from '../src'

// 导入组件工具
import { createComponent, required, newRoute, r, redirect } from '../src'

// 导入类型定义
import type { ComponentParams, Prettify, MaybeFn } from '../src'

// ===== 工具函数使用示例 =====

// ID 生成
console.log('String ID:', createStringId()) // "1"
console.log('String ID with prefix:', createStringId('user')) // "user-1"
console.log('Number ID:', createNumberId()) // 1
console.log('UUID:', generateUUID()) // "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"

// 设备检测
console.log('Is Mobile:', isMobile()) // true/false
console.log('Is Desktop:', isDesktop()) // true/false

// 防抖和节流
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const debouncedFn = debounce(() => {
  console.log('Debounced function called')
}, 300)

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const throttledFn = throttle(() => {
  console.log('Throttled function called')
}, 300)

// URL 操作
console.log('Query param:', getQuery('page', '1')) // 获取 page 参数，默认值为 '1'
setQuery('page', '2') // 设置 page 参数为 '2'
console.log('Query string:', buildQueryString({ page: '1', size: '10' })) // "?page=1&size=10"

// ===== 组件工具使用示例 =====

// 组件创建（简化示例）
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const MyComponent = createComponent(
  {
    props: {
      title: required,
      count: 0,
    },
    emits: ['click'],
  },
  (props, { emit }) => {
    // 这里应该是 Vue 组件的渲染逻辑
    console.log('Component props:', props)
    return () => console.log('Component rendered')
  }
)

// 路由创建
const homeRoute = newRoute('/home', '首页', null)
const userRoute = r('/user', '用户页面', null)
const redirectRoute = redirect('/old', '/new')

console.log('Home route:', homeRoute)
console.log('User route:', userRoute)
console.log('Redirect route:', redirectRoute)

// ===== 类型定义使用示例 =====

// 组件参数类型
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

// 使用示例
const myType: MyType = { a: 'hello', b: 123 }
const optionalFn: OptionalFn = 'hello' || (() => 'default')

console.log('My type:', myType)
console.log('Optional function:', optionalFn)

// ===== 实际应用场景示例 =====

// 1. 在 Vue 组件中使用
export const ExampleVueComponent = {
  name: 'ExampleComponent',
  setup() {
    // 使用工具函数
    const id = createStringId('component')
    const isMobileDevice = isMobile()

    // 使用防抖处理搜索
    const handleSearch = debounce((query: string) => {
      console.log('Searching for:', query)
    }, 500)

    // 使用节流处理滚动
    const handleScroll = throttle(() => {
      console.log('Scrolled')
    }, 100)

    return {
      id,
      isMobileDevice,
      handleSearch,
      handleScroll,
    }
  },
}

// 2. 在路由配置中使用
export const routes = [newRoute('/', '首页', null), newRoute('/about', '关于', null), redirect('/old-home', '/')]

// 3. 在 API 调用中使用
export const apiUtils = {
  // 构建查询参数
  buildApiUrl: (endpoint: string, params: Record<string, string>) => {
    const queryString = buildQueryString(params)
    return `${endpoint}${queryString}`
  },

  // 生成请求 ID
  generateRequestId: () => createStringId('req'),
}

console.log('API URL:', apiUtils.buildApiUrl('/api/users', { page: '1', size: '10' }))
console.log('Request ID:', apiUtils.generateRequestId())
