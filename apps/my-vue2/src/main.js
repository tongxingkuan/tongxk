import './public-path.js'
import Vue from 'vue'
import App from './App.vue'

Vue.config.productionTip = false

let instance = null

function render(props = {}) {
  console.log('子应用（yd-vue2）', props)
  const { container } = props
  instance = new Vue({
    render: h => h(App),
  }).$mount(container ? container.querySelector('#app') : '#app')
  window._QIANKUN_YD.event.emit('loading', 'vue2')
}
// 非qiankun环境下，也能独立运行时
if (!window.__POWERED_BY_QIANKUN__) {
  render()
}

/**
 * bootstrap 只会在微应用初始化的时候调用一次，下次微应用重新进入时会直接调用 mount 钩子，不会再重复触发 bootstrap。
 * 通常我们可以在这里做一些全局变量的初始化，比如不会在 unmount 阶段被销毁的应用级别的缓存等。
 */
export async function bootstrap() {}
/**
 * 应用每次进入都会调用 mount 方法，通常我们在这里触发应用的渲染方法
 */
export async function mount(props) {
  render(props)
}
/**
 * 应用每次 切出/卸载 会调用的方法，通常在这里我们会卸载微应用的应用实例
 */
export async function unmount() {
  instance.$destroy()
  instance.$el.innerHTML = ''
  instance = null
}
