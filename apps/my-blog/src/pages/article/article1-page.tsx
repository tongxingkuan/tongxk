import { createComponent } from 'shared'

export const Article1Page = createComponent(null, () => {
  const proxyArr = new Proxy([1, 2, 3], {
    get(target, prop, receiver) {
      return Reflect.get(target, prop, receiver)
    },
    set(target, prop, value, receiver) {
      console.log(`set [${prop as string | number}] 的值为 ${value}`)
      return Reflect.set(target, prop, value, receiver)
    },
    apply(target, thisArg, args) {
      console.log(`调用数组方法，参数：${args.join(', ')}`)
      return Reflect.apply(
        target as unknown as (...args: unknown[]) => unknown,
        thisArg,
        args,
      )
    },
    getOwnPropertyDescriptor(target, prop) {
      const desc = Reflect.getOwnPropertyDescriptor(target, prop)
      if (typeof desc?.value === 'function') {
        // 包装数组方法（如 push、splice）
        return {
          ...desc,
          value: (...args: unknown[]) => {
            console.log(
              `调用方法 ${prop as string | number}，参数：${args.join(', ')}`,
            )
            const result = desc.value.apply(target, args)
            // 自定义逻辑（如通知变化）
            console.log('数组变化后:', target)
            return result
          },
        }
      }
      return desc
    },
  })

  proxyArr.push(1)
  proxyArr.pop()
  proxyArr.shift()

  return () => <div>article1</div>
})

export default Article1Page
