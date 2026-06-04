import 'src/App.css'
import { HashRouter, Route, Routes } from 'react-router-dom'
import Home from 'src/pages/Home'
import List from 'src/pages/List'
import Login from 'src/pages/Login'
import Register from 'src/pages/Register'
import SiteHeader from 'src/components/SiteHeader'
import { SiteConfigProvider } from 'src/context/SiteConfigContext'
import { Provider, useDispatch } from 'react-redux'
import store, { type AppDispatch } from './store'
import { restoreSession } from './store/auth'
import { useEffect } from 'react'

function AppShell() {
  const dispatch = useDispatch<AppDispatch>()

  useEffect(() => {
    void dispatch(restoreSession())
  }, [dispatch])

  return (
    <SiteConfigProvider>
      <HashRouter>
        <div className="site-shell">
          <SiteHeader />
          <main className="site-main">
            <Routes>
              <Route path="/" Component={Home} />
              <Route path="/list" Component={List} />
              <Route path="/login" Component={Login} />
              <Route path="/register" Component={Register} />
            </Routes>
          </main>
        </div>
      </HashRouter>
    </SiteConfigProvider>
  )
}

const App = () => (
  <Provider store={store}>
    <AppShell />
  </Provider>
)

export default App
