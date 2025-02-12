import ReactDOM from 'react-dom/client'
import App from './App'
import './public-path'

let root: ReactDOM.Root

const render = (props?: { msg: string }) => {
  console.log('render', props)
  root = ReactDOM.createRoot(document.getElementById('root') as Element)
  root.render(App() as React.ReactElement)
}

if (!window.__POWERED_BY_QIANKUN__) {
  render()
}
// eslint-disable-next-line @typescript-eslint/require-await
async function bootstrap() {
  console.log('%c%s', 'color: green;', 'react bootstraped')
}
// eslint-disable-next-line @typescript-eslint/require-await
async function mount(props: { msg: string }) {
  render(props)
}
// eslint-disable-next-line @typescript-eslint/require-await
async function unmount() {
  root.unmount()
}

export { bootstrap, mount, unmount }
