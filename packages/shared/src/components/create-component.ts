import type { ComponentParams, Extra, PropsWithDefaults, Prettify, Emits2Events, Renderable } from '../types'

export type SlotFn<T = unknown> = (...args: T[]) => Renderable

export type Options2Props<T extends ComponentParams> = Prettify<
  T['props'] & { slots?: T['slots'] } & Emits2Events<T['emits']>
>

// 定义组件上下文类型
interface ComponentContext {
  emit?: (event: string, ...args: unknown[]) => void
  attrs?: Record<string, unknown>
  slots?: Record<string, unknown>
  expose?: (exposed: Record<string, unknown>) => void
}

type ComponentRenderFn<T> = (props: T, context: ComponentContext) => Renderable

export const createComponent = <T extends ComponentParams, I = unknown>(
  params:
    | (Omit<T, 'slots' | 'props'> & {
        props?: PropsWithDefaults<T['props']>
      } & Extra)
    | null,
  fn: ComponentRenderFn<Required<T['props']> & I>
) => {
  checkProps(params?.props)
  return fn
}

export const fn = () => {}

export const isArrayOrObject = (v: unknown) => {
  return v !== null && (Array.isArray(v) || typeof v === 'object')
}

function checkProps(props?: object) {
  if (!props) {
    return
  }
  Object.entries(props).forEach(([key]) => {
    if (key.startsWith('on') && key[2] && /[A-Z]/.test(key[2])) {
      console.warn(
        `${key} 可能是一个事件，你应该将其放到 emits 中而不是 props 中。只有一些特殊情况你才需要将其放到 props 中，参考文章 https://blog.davy.tw/posts/access-listeners-in-vue3-components/`
      )
    }
  })
}

export { required } from '../types'
