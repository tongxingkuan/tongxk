---
title: 'Promise 面试题'
description: 'async/await 打印顺序、带并发限制的异步任务调度器'
querys: ['Promise', 'promise', 'async', 'await', '打印顺序', '任务调度器', '并发限制', 'Scheduler', '微任务']
---

## Promise 面试题

> Promise 基础与事件循环详解参见 [Promise](/articles/promise)

### async/await 执行顺序（一）

```js
async function async1() {
  console.log('1') // sync
  await async2()
  console.log('2') // microTask
}

async function async2() {
  console.log('3') // sync
}

console.log('4') // sync
async1()

setTimeout(() => {
  console.log('5') // macroTask
}, 0)

new Promise((resolve, reject) => {
  console.log('6') // sync
  resolve()
}).then(() => {
  console.log('7') // microTask
})

console.log('8') // sync
```

首先为每一句代码打上注释可以帮助分析，理清顺序。然后按照执行顺序，依次打印： 4 1 3 6 8 2 7 5

### async/await 与 Promise 混合代码的打印顺序（二）

```js
console.log(1)

new Promise((resolve, reject) => {
  console.log(2)
  resolve(3)
  console.log(4)
}).then(result => {
  console.log(result)
})

function test1() {
  console.log(5)
  new Promise((resolve, reject) => {
    console.log(6)
    resolve(7)
    console.log(8)
  })
}

async function test2() {
  console.log(9)
  await test1()
  console.log(10)
}

await test2()
console.log(11)

// 1 2 4 9 5 6 8 3 10 11
// 分析：
// 同步阶段：1 → 2 4（new Promise 内同步执行）→ 9 → 5 → 6 8（test1 内的 Promise 同步执行，但没有 then 接收，7 被丢弃）
// await test2()：test2 返回的 Promise resolve 后恢复后续代码，10 与 11 属于同一轮微任务
// 最后执行 .then(result => ...) 微任务，输出 3
```

### 实现一个带并发限制的异步任务调度器

要求：`add` 接收一个返回 Promise 的函数，任意时刻最多同时执行 `maxConcurrent` 个任务，超出则排队，任务完成后自动从队列取出下一个执行。

```js
class Scheduler {
  constructor(maxConcurrent = 2) {
    this.maxConcurrent = maxConcurrent // 最大并发数
    this.runningCount = 0 // 当前正在执行的任务数
    this.queue = [] // 等待执行的任务队列
  }

  /**
   * 添加任务：传入一个返回 Promise 的函数
   * 返回一个 Promise，任务完成后 resolve 任务的结果（支持 await 拿到返回值）
   */
  add(task) {
    return new Promise((resolve, reject) => {
      // 把"执行任务 + 传递结果"封装成一个闭包入队
      const run = () => {
        this.runningCount++
        task()
          .then(resolve, reject)
          .finally(() => {
            this.runningCount--
            this._next()
          })
      }

      if (this.runningCount < this.maxConcurrent) {
        run() // 有空闲槽位，立即执行
      } else {
        this.queue.push(run) // 否则排队等待
      }
    })
  }

  _next() {
    if (this.queue.length > 0 && this.runningCount < this.maxConcurrent) {
      const run = this.queue.shift()
      run()
    }
  }
}

// ==================== 测试 ====================
const timeout = time => new Promise(resolve => setTimeout(resolve, time))

const scheduler = new Scheduler(2)

const addTask = (time, order) => {
  scheduler.add(() => timeout(time)).then(() => console.log(order))
}

addTask(1000, '1')
addTask(500, '2')
addTask(300, '3')
addTask(400, '4')

// 预期输出顺序：2 => 3 => 1 => 4
// 分析：
// 任务1、任务2 立即开始执行（并发数 2 已占满）
// 500ms 后任务2完成输出 2，任务3 开始执行
// 800ms 后任务3完成输出 3，任务4 开始执行
// 1000ms 后任务1完成输出 1
// 1200ms 后任务4完成输出 4
```
