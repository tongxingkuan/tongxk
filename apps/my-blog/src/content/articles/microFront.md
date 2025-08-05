---
title: '微前端'
description: '微前端、乾坤'
querys: ['qiankun', '微前端']
---

## 微前端实践

### 沙箱实现原理

#### 1. 全局变量的隔离

`qiankun`通过Proxy代理了window对象，从而实现了沙箱隔离。

```js
class Sandbox {
  constructor() {
    this.originWindow = window
    this.proxyWindow = new Proxy(window, {
      set(target, prop, value) {
        if (this.proxyWindow[prop] !== undefined) {
          this.proxyWindow[prop] = value
          return true
        }
        this.originWindow[prop] = value
        return true
      },
      get(target, prop) {
        if (this.proxyWindow[prop] !== undefined) {
          return this.proxyWindow[prop]
        }
        return this.originWindow[prop]
      },
    })
  }

  active() {
    window = this.proxyWindow
  }

  inactive() {
    window = this.originWindow
  }

  destroy() {
    for (const key in this.proxyWindow) {
      if (this.proxyWindow.hasOwnProperty(key)) {
        this.proxyWindow[key] = undefined
      }
    }
  }
}

const sandbox = new Sandbox()

sandbox.active()

window.a = 1

sandbox.inactive()

sandbox.destroy()

window.a // undefined
```

#### 2. 样式隔离

`qiankun`通过`Shadow DOM`或者`scoped`隔离样式，从而实现了样式隔离。对于不支持shadow dom的浏览器，`qiankun`会使用`CSS 前缀`来实现样式隔离。

```js
// 获取微应用的根元素
const rootElement = document.getElementById('sub-app-root')

// 创建 Shadow Root
const shadowRoot = rootElement.attachShadow({ mode: 'open' })

// 插入样式
const style = document.createElement('style')
style.textContent = `
    .app-header {
        background-color: blue;
        color: white;
    }
`
shadowRoot.appendChild(style)

// 插入内容
const div = document.createElement('div')
div.className = 'app-header'
div.textContent = 'Hello, Qiankun!'
shadowRoot.appendChild(div)
```

#### 3. 事件隔离

`qiankun`会拦截和管理全局事件（如 click、resize 等），确保事件不会跨微应用传播。通过事件代理和事件委托，实现事件的精确控制和隔离。

```js
window.addEventListener('message', event => {
  console.log(event.data)
})
```

#### 4. 生命周期管理

`qiankun`会拦截和管理微应用的生命周期，确保微应用的加载、卸载、激活、停用等操作有序进行。通过`bootstrap`、`mount`、`unmount`等生命周期钩子，实现微应用的精确控制和隔离。
在 `unmount` 阶段，乾坤会清理微应用的全局变量、事件监听器等，确保微应用卸载后不会留下残留。

### 应用之间的通信

干货：
<https://juejin.cn/post/7441617631907397659?searchId=20250212180716617E6F0A269FE8C7B8E8>

### 乾坤子项目

[vue2](/qiankun/vue2App) &nbsp;
[vue3](/qiankun/viteApp) &nbsp;
[react](/qiankun/reactApp) &nbsp;
