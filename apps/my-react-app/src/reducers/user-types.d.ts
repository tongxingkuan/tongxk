declare namespace UserTypes {
  interface UserState {
    name: string
    age: number
    bonus: number
  }
  interface UserAction {
    type: string
    payload: number
  }
}
