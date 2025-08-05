/* eslint-disable */
import { registerMicroApps, start } from 'qiankun'

export default defineNuxtPlugin(nuxtApp => {
  registerMicroApps(
    [
      {
        name: 'vite-app',
        entry: import.meta.env.DEV ? '//localhost:3001/' : 'http://tongxingkuan.xin:3001/',
        container: '#viteApp',
        activeRule: '/qiankun/viteApp',
        props: {
          msg: 'hello from parent',
        },
      },
      {
        name: 'react-app',
        entry: import.meta.env.DEV ? '//localhost:3002/' : 'http://tongxingkuan.xin:3002/',
        container: '#reactApp',
        activeRule: '/qiankun/reactApp',
        props: {
          msg: 'hello from parent',
        },
      },
      {
        name: 'vue2-app',
        entry: import.meta.env.DEV ? '//localhost:3003/' : 'http://tongxingkuan.xin:3003/',
        container: '#vue2App',
        activeRule: '/qiankun/vue2App',
        props: {
          msg: 'hello from parent',
        },
      },
    ],
    {
      beforeLoad: [
        app => {
          console.log('before load', app.name)
          return Promise.resolve()
        },
      ],
      beforeMount: [
        app => {
          console.log('before mount', app.name)
          return Promise.resolve()
        },
      ],
      beforeUnmount: [
        app => {
          console.log('before unmount', app.name)
          return Promise.resolve()
        },
      ],
    }
  )
  start({
    sandbox: {
      experimentalStyleIsolation: true,
    },
  })
})

declare global {
  interface Window {
    _QIANKUN_YD: {
      event: {
        on: (eventName: string, callback: (eventName: string, ...args: unknown[]) => void) => void
        once: (eventName: string, callback: (...args: unknown[]) => void) => void
        off: (eventName: string, callback: (...args: unknown[]) => void) => void
        watch: (callback: (...args: unknown[]) => void) => void
      }
      store: {}
    }
  }
}

window._QIANKUN_YD = window._QIANKUN_YD || {
  // 通信
  event: (() => {
    class Emitter {
      events: Record<string, { callback: (...args: any[]) => void; count: number }[]> = {}

      watches: ((...args: any[]) => void)[] = []
      constructor() {
        this.events = {}
        this.watches = []
      }

      add(eventName: string, callback: (...args: any[]) => void, count: number) {
        if (!eventName || typeof callback !== 'function') return
        if (!this.events[eventName]) {
          this.events[eventName] = []
          this.events[eventName].push({ callback, count })
        } else {
          const hasExist = this.events[eventName].some(item => item.callback === callback && item.count === count)
          if (!hasExist) {
            this.events[eventName].push({ callback, count })
          }
        }
      }

      emit(...args: any[]) {
        const [eventName, ...restArgs] = args
        const callbacks = this.events[eventName] || []
        if (eventName && this.watches.length > 0) {
          this.watches.forEach(callback => {
            callback.apply(this, [eventName, ...restArgs])
          })
        }
        if (eventName && callbacks.length > 0) {
          callbacks.forEach(({ callback, count }) => {
            callback.apply(this, [eventName, ...restArgs])
            if (count) {
              this.off(eventName, callback)
            }
          })
        }
      }

      on(eventName: string, callback: (...args: any[]) => void) {
        this.add(eventName, callback, 0)
      }

      once(eventName: string, callback: (...args: any[]) => void) {
        this.add(eventName, callback, 1)
      }

      off(eventName: string, callback: (...args: any[]) => void) {
        const callbacks = this.events[eventName] || []
        if (callbacks.length <= 0) return
        if (!callback) this.events[eventName] = []
        callbacks.forEach((item, index) => {
          if (item.callback === callback) {
            callbacks.splice(index, 1)
          }
        })
      }

      watch(callback: (...args: any[]) => void) {
        if (typeof callback !== 'function') return
        this.watches.push(callback)
      }
    }
    return new Emitter()
  })(),
}

// 订阅loading事件
window._QIANKUN_YD.event.on('loading', (eventName: string, data: unknown) => {
  console.log('on ' + eventName, data)
})
