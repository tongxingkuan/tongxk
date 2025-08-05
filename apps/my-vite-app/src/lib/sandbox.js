class Sandbox {
  constructor() {
    this.originWindow = window
    this.proxyWindow = new Proxy(window, {
      get(target, prop) {
        if (this.proxyWindow[prop] !== undefined) {
          return this.proxyWindow[prop]
        }
        return target[prop]
      },
      set(target, prop, value) {
        if (this.proxyWindow[prop] !== undefined) {
          this.proxyWindow[prop] = value
        } else {
          target[prop] = value
        }
      },
    })
  }

  activate() {
    Object.assign(this.proxyWindow, this.originWindow)
  }

  deactivate() {
    Object.assign(this.proxyWindow, this.originWindow)
  }
}
