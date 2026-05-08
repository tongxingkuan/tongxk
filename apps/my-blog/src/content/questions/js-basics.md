---
title: 'JS 基础面试题'
description: 'Generator、Map vs Object、for...of 迭代、instanceof、数组去重'
querys: ['Generator', 'Map', 'Object', 'for...of', 'instanceof', '数组去重', 'Symbol.iterator']
---

## JS 基础面试题

### Generator

`ES6` 新增特性函数，可以被暂停和恢复，在调用 Generator 函数时，不会立即执行，而是返回一个可暂停执行的 Generator 对象，之后调用该对象的 `.next()` 方法，恢复函数的执行。使得我们能够编写更加灵活和更具表现力的代码。

```js
function* generate1() {
  yield 1
  yield 2
  yield 3
}

let gen = generate1()

console.log(gen.next()) // {value: 1, done: false}
console.log(gen.next()) // {value: 2, done: false}
console.log(gen.next()) // {value: 3, done: false}
console.log(gen.next()) // {value: undefined, done: true}
```

`for await ... of` 循环语句可以遍历 Generator 函数生成的迭代器，从而实现异步迭代。

```js
function* generate2() {
  yield 1
  yield 2
  yield 3
}
async function test() {
  for await (const result of generate2()) {
    console.log(result)
  }
}
test() // 1 2 3
```

### Map 和 Object 的区别

Map 的原型链最终指向 Object，所以 Map 本质也是一个对象，但是它和 Object 也有一些重要的区别：

1. Map 的键值可以是函数、对象或其他任意类型的值，而 Object 的键必须是一个 String 或者 Symbol
2. Map 中的键是有序的，因此遍历一个 Map 对象以插入的顺序返回键值；而 Object 最好不要依赖属性的顺序
3. Map 在频繁增删键值对的场景下表现更好
4. 没有元素的序列化和解析的支持

针对以上第四点，有如下解决方案：

```js
function JsonStringifyForMap(mapData) {
  function replacer(key, value) {
    if (value instanceof Map) {
      return {
        dataType: 'Map',
        value: Array.from(value.entries()), // 或者用 [...value]
      }
    } else {
      return value
    }
  }
  const mapToString = JSON.stringify(mapData, replacer)
  return mapToString
}
function JsonParseToMap(str) {
  function receiver(key, value) {
    if (typeof value === 'object' && value !== null) {
      if (value.dataType === 'Map') {
        return new Map(value.value)
      } else {
        return value
      }
    } else {
      return value
    }
  }
  const stringToMap = JSON.parse(str, receiver)
  return stringToMap
}
```

### 对象如何使用 for ... of 迭代

```js
let obj = {
  a: 1,
  b: 2,
}
obj.__proto__[Symbol.iterator] = function* () {
  for (let k in this) {
    if (this.hasOwnProperty(k)) {
      yield [k, this[k]]
    }
  }
}

for (let k of obj) {
  console.log(k)
}
// ['a', 1]
// ['b', 2]
```

### 手搓 instanceof

```js
function myInstanceof(left, right) {
  if (typeof right !== 'function') {
    return 'right must be function'
  }
  let proto = Object.getPrototypeOf(left)
  while (proto) {
    if (proto === right.prototype) {
      return true
    }
    proto = Object.getPrototypeOf(proto)
  }
  return false
}
```

### 数组去重

```js
function unique(arr) {
  return [...new Set(arr)]
}
```
