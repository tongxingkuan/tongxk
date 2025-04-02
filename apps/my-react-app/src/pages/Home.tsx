import { addBonus, addBonusAsync } from 'src/reducers/user-reducer'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
function Home() {
  const dispatch = useDispatch()
  const user = useSelector(
    (state: { user: UserTypes.UserState }) => state.user,
  )
  const add = () => {
    dispatch(addBonus(10))
  }
  const asyncAdd = () => {
    // @ts-expect-error 忽略类型错误
    dispatch(addBonusAsync(10))
  }
  const bonusState = useSelector(
    (state: { user: UserTypes.UserState }) => state.user.bonus,
  )
  const fetchBonus = () => {
    // @ts-expect-error 忽略类型错误
    dispatch(fetchBonus())
  }
  useEffect(() => {
    return () => {
      console.log('home unmount')
    }
  }, [])
  return (
    <div>
      <h1>Home</h1>
      <p>Name: {user.name}</p>
      <p>Bonus: {user.bonus}</p>
      <button onClick={add}>Add Bonus</button>
      <button onClick={asyncAdd}>Async Add Bonus</button>
    </div>
  )
}
export default Home
