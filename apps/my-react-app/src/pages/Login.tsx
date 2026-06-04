import { FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { clearError, login } from 'src/store/auth'
import type { AppDispatch, RootState } from 'src/store'

export default function Login() {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const { user, loading, error } = useSelector((s: RootState) => s.auth)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    if (user) void navigate('/', { replace: true })
  }, [user, navigate])

  if (user) return null

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    dispatch(clearError())
    try {
      await dispatch(login({ username, password })).unwrap()
      void navigate('/')
    } catch {
      /* handled in store */
    }
  }

  return (
    <div className="page auth-page">
      <h1>登录</h1>
      <form onSubmit={onSubmit}>
        <label>
          用户名
          <input value={username} onChange={e => setUsername(e.target.value)} />
        </label>
        <label>
          密码
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? '登录中...' : '登录'}
        </button>
      </form>
      <p>
        还没有账号？<Link to="/register">注册</Link>
      </p>
    </div>
  )
}
