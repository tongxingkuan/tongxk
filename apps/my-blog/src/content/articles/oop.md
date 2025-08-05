---
title: '面向对象'
description: '深入对象'
querys: ['object', '面向对象', '对象', '原型', '数组', '正则']
---

## 面向对象编程 OOP

### 引入构造函数

本博文采用对比 es5 和 es6 的写法。

```js
// es5
function Person(name, gender, idNumber) {
  // 记录人的基本属性
  this.name = name
  this.gender = gender
  // 后期私有属性
  this._idNumber = idNumber

  this.obj = {
    a: 1,
  }
}

// 鉴权
Person.prototype.validate = idNumber => {
  return String(this._idNumber) === String(idNumber)
}

// 吃
Person.prototype.eat = () => {
  console.log('eat')
}
```

```js
// es6
class Person {
  constructor(name, gender, idNumber) {
    // 记录人的基本属性
    this.name = name
    this.gender = gender
    // 后期私有属性
    this._idNumber = idNumber
  }

  // 记录人的基本方法

  // 身份核对
  validate(idNumber) {
    return String(this._idNumber) === String(idNumber)
  }

  // 吃饭
  eat() {
    console.log('eat')
  }
}
```

以上我们构造了一个`关于人的类`，那么要创建各种各样的`人`，我们就要调用构造函数，实例化人这个对象。为此引入`new`操作符。

```js
// 张三 - 人
let zhangsan = new Person('zhangsan', '男', '123XX')
```

至此先分析一波：`new Person`即实例化操作，参数依次对应：`name`、`gender`、`_idNumber`。实例化过程中，`this`指向当前实例对象，并且最终返回实例对象。

### 面向对象三大特性

#### 封装

封装指的是将代码集中管理，能够体现代码的公用性，以上两种构造函数的写法就体现了面向对象的封装性。

#### 继承

考虑到人也分多种职业，例如老师、程序员、农民等等，但是他们又都具有`人构造函数`所定义的这些基本特征，为了体现面向对象的`封装性`，我们要新建`其他类`，并继承自`人类`。

##### 构造函数绑定

- 实现方式：在`Teacher`的构造函数中加一行。

```js
function Teacher(name, gender, idNumber, course) {
  Person.apply(this, arguments) // Person.call(this, name, gender, idNumber)
  // 定义老师特有的属性和方法
  this.course = course
}
// 李四 - 老师
let lisi = new Teacher('lisi', '男', '123X', 'english')
lisi.eat() // undefined
```

- 缺点：_该方式无法继承Person的原型对象上的属性和方法。_

##### 原型链继承

- 实现方式： 让`Coder`的`prototype`属性指向`Person`的实例

```js
function Coder(language) {
  this.language = language
}
// 原型链继承
Coder.prototype = new Person()
Coder.prototype.constructor = Coder

// 王五 - 程序员
let wangwu = new Coder('javascript')
// 赵六 - 程序员
let zhaoliu = new Coder('c++')
wangwu.name // undefined
wangwu.eat() // 'eat'
wangwu.obj.a = 2
zhaoliu.obj.a // 2
```

- 缺点：_1. 无法向父构造函数传递参数；2. 所有的实例共享原型对象，如果一个实例修改了`原型对象`，其他实例的属性和方法也会受到影响。_

##### 组合继承（伪经典继承）

- 实现方式：就是将上述两种继承方式组合起来

```js
function Combine() {
  Person.apply(this, arguments)
}

Combine.prototype = new Person()
Combine.prototype.constructor = Combine

let combine = new Combine('combine', '女', '123456X')
```

- 缺点：_可以看到`Person`被两次调用。_

##### 寄生式继承

- 实现方式：利用空对象作为中介，解决了两次调用`Person`的问题

```js
if (!Object.create) {
  Object.create = function (proto) {
    var F = function () {}
    F.prototype = proto
    return new F()
  }
}

function Farmer() {}
Farmer.prototype = Object.create(Person.prototype)
Farmer.prototype.constructor = Farmer

let f1 = new Farmer() // 此处无法传参给Person
```

- 缺点：_没有解决构造函数参数传递问题。_

##### 寄生式组合继承（经典继承）

- 实现方式：组合使用经典继承和构造函数继承

```js
if (!Object.create) {
  Object.create = function (proto) {
    var F = function () {}
    F.prototype = proto
    return new F()
  }
}

function Farmer() {
  Person.apply(this, arguments)
}
Farmer.prototype = Object.create(Person.prototype)
Farmer.prototype.constructor = Farmer
let f2 = new Farmer('f2', '男', '222X')
```

#### 多态

维基百科这样解释：多态 (计算机科学)（polymorphism）：为不同资料类型的实体提供统一的界面，或使用一个单一的符号来表示多个不同的类型。

通俗来说就是：不同的数据类型进行同一个操作，表现出不同的行为，就是多态的体现。

在js中，一般是指根据参数的个数、类型等不同，在函数内部判断，进而引导程序走向不同的分支，最终产生不同的结果。

```ts
// TODO 源码demo 解读多态
```
