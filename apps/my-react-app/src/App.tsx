import 'src/App.css'
import { HashRouter, Link, Route, Routes } from 'react-router-dom'
import Home from 'src/pages/Home'
import List from 'src/pages/List'
import 'src/lib/visitor'
import { Provider } from 'react-redux'
import userStore from './store/user'

const App = () => {
  return (
    <>
      <h1 className="title">Hello React!</h1>
      <Provider store={userStore}>
        <HashRouter>
          <div className="flex flex-col items-center justify-center">
            <Link to="/">首页</Link>
            <Link to="/list">列表</Link>
          </div>
          <Routes>
            <Route path="/" Component={Home} />
            <Route path="/list" Component={List} />
          </Routes>
        </HashRouter>
      </Provider>
    </>
  )
}

export default App
