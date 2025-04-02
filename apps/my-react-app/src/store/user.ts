import userReducer from 'src/reducers/user-reducer'
import { configureStore } from '@reduxjs/toolkit'

const userStore = configureStore({
  reducer: {
    user: userReducer,
  },
})

export default userStore
