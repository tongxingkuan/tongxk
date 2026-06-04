import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import { api, clearToken, getToken, isGuestMode, setGuestMode, setToken, type ApiUser } from 'src/lib/api'

export interface AuthState {
  user: ApiUser | null
  guest: boolean
  loading: boolean
  error: string | null
}

const initialState: AuthState = {
  user: null,
  guest: isGuestMode(),
  loading: false,
  error: null,
}

export const restoreSession = createAsyncThunk('auth/restore', async () => {
  if (!getToken()) return null
  return api.me()
})

export const login = createAsyncThunk(
  'auth/login',
  async ({ username, password }: { username: string, password: string }) => {
    const res = await api.login(username, password)
    setToken(res.token)
    setGuestMode(false)
    return res.user
  },
)

export const register = createAsyncThunk(
  'auth/register',
  async ({ username, password }: { username: string, password: string }) => {
    const res = await api.register(username, password)
    setToken(res.token)
    setGuestMode(false)
    return res.user
  },
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    enterGuest: state => {
      clearToken()
      setGuestMode(true)
      state.user = null
      state.guest = true
      state.error = null
    },
    logout: state => {
      clearToken()
      setGuestMode(false)
      state.user = null
      state.guest = false
      state.error = null
    },
    clearError: state => {
      state.error = null
    },
  },
  extraReducers: builder => {
    builder
      .addCase(restoreSession.pending, state => {
        state.loading = true
      })
      .addCase(restoreSession.fulfilled, (state, action: PayloadAction<ApiUser | null>) => {
        state.loading = false
        state.user = action.payload
        state.guest = !action.payload && isGuestMode()
      })
      .addCase(restoreSession.rejected, state => {
        state.loading = false
        clearToken()
        state.user = null
      })
      .addCase(login.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<ApiUser>) => {
        state.loading = false
        state.user = action.payload
        state.guest = false
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message ?? '登录失败'
      })
      .addCase(register.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(register.fulfilled, (state, action: PayloadAction<ApiUser>) => {
        state.loading = false
        state.user = action.payload
        state.guest = false
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message ?? '注册失败'
      })
  },
})

export const { enterGuest, logout, clearError } = authSlice.actions
export default authSlice.reducer
