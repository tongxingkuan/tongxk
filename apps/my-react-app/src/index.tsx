import ReactDOM from 'react-dom/client'
import App from './App'
import './public-path'

let root: ReactDOM.Root

declare global {
  interface Window {
    __POWERED_BY_QIANKUN__: boolean
    _QIANKUN_YD: {
      event: {
        on: (eventName: string, callback: (...args: unknown[]) => void) => void
        emit: (eventName: string, ...args: unknown[]) => void
        once: (
          eventName: string,
          callback: (...args: unknown[]) => void,
        ) => void
        off: (
          eventName: string,
          callback: (...args: unknown[]) => void,
        ) => void
        watch: (callback: (...args: unknown[]) => void) => void
      }
    }
  }
}

const render = (props?: { msg: string }) => {
  console.log('render', props)
  root = ReactDOM.createRoot(document.getElementById('root') as Element)
  root.render(App() as React.ReactElement)
}

if (!window.__POWERED_BY_QIANKUN__) {
  render()
}

async function bootstrap() {
  console.log('%c%s', 'color: green;', 'react bootstraped')
}

async function mount(props: { msg: string }) {
  render(props)
  window._QIANKUN_YD.event.emit('loading', 'react')
}

async function unmount() {
  root.unmount()
}

export { bootstrap, mount, unmount }
