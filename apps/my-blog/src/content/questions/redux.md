---
title: '手搓 Redux'
description: '手写一个简易 Redux，理解 createStore、reducer、dispatch、subscribe'
querys: ['redux', 'Redux', 'createStore', 'reducer', 'dispatch', 'subscribe', '状态管理']
---

## 手搓 Redux

### 核心 API 实现

Redux 的核心非常小：**一个单向数据流的状态容器**，包含 `getState`、`dispatch`、`subscribe` 三个方法，以及一个纯函数 `reducer` 负责根据 action 计算新状态。

```js
function createStore(reducer) {
  let state = {}
  let subscribers = []

  state = reducer({ name: '张三', age: 18 }) // 初始化状态

  const getState = () => {
    return state
  }

  const dispatch = action => {
    state = reducer(state, action)
    subscribers.forEach(subscriber => subscriber())
    return action
  }

  const subscribe = subscriber => {
    let idx = subscribers.push(subscriber)
    return () => {
      subscribers.splice(idx, 1)
    }
  }

  return {
    getState,
    dispatch,
    subscribe,
  }
}

const userReducer = (state, action) => {
  if (!action) return state
  switch (action.type) {
    case 'changeName':
      state.name = action.name
      return state
    case 'changeAge':
      state.age += action.age
      return state
    default:
      return state
  }
}

let userStore = createStore(userReducer)

userStore.subscribe(() => {
  const state = userStore.getState()
  console.log(state)
})

userStore.dispatch({
  type: 'changeName',
  name: '李四',
})

userStore.dispatch({
  type: 'changeAge',
  age: -8,
})
```

### 关键设计思想

- **单一数据源（Single Source of Truth）**：整个应用的 state 存在一个 store 里，便于调试、快照、时间旅行。
- **State 只读**：唯一修改方式是 `dispatch(action)`，禁止直接 mutate，保证可预测性。
- **纯函数 reducer**：`(state, action) => newState`，相同输入必得相同输出，便于测试。
- **发布订阅**：`subscribe` 注册监听者，`dispatch` 后逐个通知，React 绑定（`react-redux`）基于此实现。

### 面试常问的扩展点

- **combineReducers 原理**：拆分子 reducer，聚合为一个大 reducer，每个子 reducer 只负责自己管辖的 state 分片。
- **applyMiddleware 原理**：本质是对 `dispatch` 的 **洋葱模型** 装饰，通过高阶函数链式调用，核心一行 `compose(...middlewares.map(m => m({ getState, dispatch })))`。
- **redux-thunk / redux-saga**：`thunk` 让 action 可以是函数，用于异步；`saga` 基于 generator，更适合复杂流程编排。
- **Redux Toolkit**：官方推荐写法，内置 `createSlice` + Immer，实现"可变式"写 reducer 但底层仍是不可变。
