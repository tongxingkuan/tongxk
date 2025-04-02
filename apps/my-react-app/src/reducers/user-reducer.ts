import { createAsyncThunk, createSlice, Dispatch } from '@reduxjs/toolkit'

export const userSlice = createSlice({
  name: 'user',
  initialState: {
    name: 'John',
    age: 20,
    bonus: 0,
  },
  reducers: {
    addBonus: (state, action) => {
      state.bonus += action.payload
    },
  },
})

export const { addBonus } = userSlice.actions

export const addBonusAsync = (amount: number) => (dispatch: Dispatch) => {
  setTimeout(() => {
    dispatch(addBonus(amount))
  }, 1000)
}

export const fetchBonus = createAsyncThunk('user/fetchBonus', async () => {
  const response = await fetch(`/api/bonus`)
  return response.json()
})

export default userSlice.reducer
