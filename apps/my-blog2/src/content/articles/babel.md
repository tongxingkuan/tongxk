---
title: "Babel 解析"
description: "Babel 解析"
querys: ["Babel", "Babel 解析", "preset", "plugin"]
---

## Babel 解析

### 什么是 Babel

Babel 是一个 JavaScript 编译器，它将 ECMAScript 2015+ 代码转换为向后兼容的 JavaScript 代码。其工作流程如下：

1. 解析：将代码解析为抽象语法树（AST）
2. 转换：对 AST 进行转换
3. 优化：对转换后的 AST 进行优化
4. 生成：将优化后的 AST 生成新的代码

### 配置babel的三种方式

- 配置文件：babel.config.js

```js
// babel.config.js
module.exports = {
  presets: ["@babel/preset-env", "@babel/preset-react"],
  plugins: ["@babel/plugin-transform-runtime"],
};
```

- 配置文件：.babelrc

```json
{
  "presets": ["@babel/preset-env", "@babel/preset-react"],
  "plugins": ["@babel/plugin-transform-runtime"]
}
```

- babel 配置：package.json

```json
{
  // ...
  "babel": {
    "presets": ["@babel/preset-env", "@babel/preset-react"],
    "plugins": ["@babel/plugin-transform-runtime"]
  }
}
```

### presets

通过预设的插件集合，根据指定的目标环境转译代码

常见的presets如下：

- `@babel/preset-env`：用于根据目标环境（如浏览器或 Node.js 版本）自动确定需要转换的 ECMAScript 语法特性和按需引入 Polyfill。

```js
// babel.config.js
{
  presets: [
    [
      "@babel/preset-env",
      {
        // 目标环境（优先级高于 .browserslistrc）
        targets: {
          browsers: ["last 2 versions", "> 1%"], // 或指定具体版本，如 "chrome": "80"
          node: "current", // Node.js 当前版本
        },
        // Polyfill 模式：按需注入（需安装 core-js）
        useBuiltIns: "usage", // 可选 "entry" 或 false
        corejs: "3.32",       // 指定 core-js 版本
        // 其他优化选项
        bugfixes: true,       // 启用语法修复优化（类似 @babel/preset-modules）
        modules: false,       // 保留 ES 模块语法（由打包工具处理）
      },
    ],
  ],
}
```

- `@babel/preset-typescript`：用于转换 TypeScript 代码为 JavaScript 代码。

```js
// babel.config.js
{
  presets: [
    "@babel/preset-typescript",
    {
        "isTSX": true, // 指定是否开启 TSX 模式
        "allExtensions": true, // 指定是否开启所有扩展名
        "allowNamespaces": true, // 指定是否允许命名空间
        "isDefinitelyTyped": true, // 指定是否开启 DefinitelyTyped 模式
        "strict": true, // 指定是否开启严格模式
        "skipLibCheck": true, // 指定是否跳过库检查
        "onlyRemoveTypeImports": true, // 指定是否只删除类型导入
    }
  ],
}
```

### plugins

插件的核心工作是遍历 AST。通过访问 AST 中的节点，插件可以识别并对特定的语法进行处理。

#### @babel/plugin-transform-runtime

是一个用于将 ES6 的语法转换为 ES5 的插件，它可以帮助我们避免在每个文件中重复引入 polyfill。

```js
// babel.config.js
module.exports = {
  presets: ["@babel/preset-env", "@babel/preset-typescript"],
  plugins: [
    [
      "@babel/plugin-transform-runtime",
      {
        corejs: 3, // 使用 core-js 3 版本 (默认 false)
        helpers: true, // 复用工具函数 (默认 true)
        regenerator: true, // 复用 regenerator 运行时 (默认 true)
        useESModules: false, // 是否使用 ES 模块 (根据构建目标设置)
      },
    ],
  ],
};
```

#### 自定义插件

##### 插件的基本结构

一个简单的 Babel 插件是一个 JavaScript 函数，它可以接受 babel 的 API，并返回一个对象。这个对象必须包含一个 visitor 对象，visitor 是一个包含处理 AST 中各类节点的回调函数的对象。

```js
module.exports = function ({ types: t }) {
  return {
    visitor: {
      // 处理 AST 中的每种节点
      Identifier(path) {
        if (path.node.name === "x") {
          path.node.name = "y";
        }
      },
    },
  };
};
```

- `types: t`：这是 Babel 提供的工具，用于创建和检查 AST 中的节点类型。
- `path`：每个节点都有一个 path，它是节点的上下文对象，允许插件修改节点的内容或结构。
- `visitor`：这是插件的核心，包含一个或多个处理 AST 节点的回调。每个回调对应一个特定类型的节点（如 Identifier、FunctionDeclaration 等）。
- `Identifier(path)`：这是处理标识符节点的回调函数。在这个例子中，如果标识符的名称是 "x"，则将其名称更改为 "y"。

##### 插件的使用

在 Babel 配置文件中，可以使用 `plugins` 选项来引入自定义插件。插件可以是一个字符串（插件的名称）或一个对象（插件的配置）。

```js
// babel.config.js
module.exports = {
  plugins: [
    "./my-custom-plugin.js", // 引入自定义插件
  ],
};
```

##### 示例插件

```js
// 自动为每个文件添加 "use strict";
module.exports = function () {
  return {
    visitor: {
      Program(path) {
        const directive = t.directive(t.directiveLiteral("use strict"));
        path.node.body.unshift(directive); // 在文件头插入 'use strict'
      },
    },
  };
};
```

```js
// 将所有 for 循环转换为 Array.prototype.forEach()
module.exports = function () {
  return {
    visitor: {
      ForStatement(path) {
        const { node } = path;
        const callback = t.arrowFunctionExpression(
          [t.identifier(node.left.name)], // 参数
          node.body,
        );
        const call = t.callExpression(
          t.memberExpression(node.test, t.identifier("forEach")),
          [callback],
        );
        path.replaceWith(call);
      },
    },
  };
};
```

### env

### targets
