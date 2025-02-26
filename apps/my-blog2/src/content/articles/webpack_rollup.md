---
title: "webpack和rollup"
description: "webpack和rollup的原理解析"
querys: ["webpack", "rollup"]
---

## webpack和rollup

### webpack

#### 概念

本质上，webpack 是一个用于现代 JavaScript 应用程序的 `静态模块打包工具`。当 webpack 处理应用程序时，它会递归地构建一个`依赖关系图`，其中包含应用程序需要的每个模块，然后将这些模块打包成一个或多个 `bundle`。

#### mode

如果要根据mode修改打包的配置，那么module.exports 需要返回一个函数而不是对象。

```js
// webpack.config.js
const config = {
  // ...
};

module.exports = (env, argv) => {
  if (argv.mode === "development") {
    config.devtool = "source-map";
  }
  return config;
};
```

#### entry

入口文件，是 webpack 的入口起点。常见的形式有：

- `string`：`./src/index.js`
- `array`：`["./src/index.js", "./src/app.js"]`
- `object`：`{ index: "./src/index.js", app: "./src/app.js" }`

常见场景：分离应用和第三方库，可以将不变的第三方库打包成一个文件，利用浏览器缓存，提升性能。

```js
module.exports = {
  entry: {
    main: "./src/app.js",
    vendor: "./src/vendor.js",
  },
};
```

#### output

输出文件，是 webpack 的输出结果。如果在编译过程中并不知道publicPath，可以先将其留空，通过入口文件在运行时动态设置。

```js
// public-path.js
__webpack_public_path__ = "https://cdn.example.com/";
```

```js
// app.js
import "./public-path";
```

#### loader

loader 是 webpack 的插件，用于对模块的源代码进行转换。常见的 loader 有：

- `babel-loader`：用于将 ES6 转换为 ES5
- `css-loader`：用于将 CSS 转换为 JavaScript
- `style-loader`：用于将 CSS 添加到 DOM 中

```js
module.exports = {
  module: {
    rules: [
      { test: /\.css$/, use: ["style-loader", "css-loader"] },
      { test: /\.js$/, use: ["babel-loader"] },
    ],
  },
};
```

#### resolve

```js
module.exports = {
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
    extensions: [".js", ".jsx", ".json"],
  },
};
```

#### optimization

```js
module.exports = {
  optimization: {
    splitChunks: {
      chunks: "all",
    },
  },
};
```

#### plugin

webpack 插件是一个具有 `apply` 方法的 JavaScript 对象。apply 方法会被 webpack `compiler` 调用，并且在 整个 编译生命周期都可以访问 `compiler` 对象。

```js
module.exports = {
  plugins: [
    new HtmlWebpackPlugin({
      template: "./src/index.html",
    }),
  ],
};
```

##### 自定义插件

```js
// 如果插件有参数呢？
class MyPlugin {
  constructor(options) {
    this.options = options;
  }
  apply(compiler) {
    compiler.hooks.done.tap("MyPlugin", () => {
      console.log("done");
    });
  }
}

module.exports = MyPlugin;
```

```js
// webpack.config.js
const MyPlugin = require("./my-plugin.js");
module.exports = {
  plugins: [
    new MyPlugin({
      name: "MyPlugin",
    }),
  ],
};
```

##### Nodejs 显式调用

```js
const webpack = require("webpack");
const config = require("./webpack.config.js");
const compiler = webpack(config);
new webpack.ProgressPlugin().apply(compiler);
compiler.run((err, stats) => {
  if (err) {
    console.error(err);
  }
  console.log(stats.toString());
});
```

#### 完整流程

1. 初始化参数，根据参数生成 `compiler` 对象，并注册插件，监听生命周期各个阶段的事件
2. 调用 `compiler` 对象的 `run` 方法开始编译
3. `compilation.addEntry` 触发构建流程，将 `entry` 对应的 dependence 创建 `module` 对象，调用 `loader` 将模块转译为标准 JS 内容，调用 `acorn` 将 JS 文本解析为 `AST` ，从中找出该模块依赖的模块，再 递归 本步骤直到所有入口依赖的文件都经过了本步骤的处理，形成完整的依赖关系图
4. **进入生成阶段**，根据入口文件和依赖关系图，调用 `compilation.seal` 生成代码块 `chunk`。`SplitChunksPlugin` 通过 `optimizeChunks` hooks 分析 `chunks` 集合的内容，按配置规则增加一些通用的 chunk。
5. 根据配置的 `output` 参数，将代码块 `chunk` 输出到指定目录

#### 钩子hooks

- `compilation`: 时机：在 `compilation` 对象创建之后触发，许多插件基于此事件获取 `compilation` 实例
- `make`: 时机：正式开始编译时触发，webpack 内置的 `EntryPlugin` 基于此事件生成 `entry` 模块的初始化
- `optimizeChunks`: 时机：在 `seal` 函数中，在 `chunk` 集合构建完毕后触发， `SplitChunksPlugin` 插件基于此事件分析 `chunks` 集合的内容，实现拆分优化
- `done`: 时机：编译完成时触发， `webpack-bundle-analyzer` 插件基于此钩子实现打包分析

### rollup
