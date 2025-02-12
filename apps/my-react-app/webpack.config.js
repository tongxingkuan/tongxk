const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { name } = require("./package");

module.exports = {
  entry: "./src/index.tsx",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].[contenthash].js",
    publicPath: "/",
    library: `${name}-[name]`,
    libraryTarget: "umd",
    // webpack 5 需要把 jsonpFunction 替换成 chunkLoadingGlobal
    chunkLoadingGlobal: `webpackJsonp_${name}`,
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx", "css"], // 确保处理 TS 和 TSX 文件
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: ["ts-loader"],
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./public/index.html",
      minify: {
        removeComments: true,
        collapseWhitespace: true,
      },
    }),
  ],
  optimization: {
    splitChunks: {
      chunks: "all",
    },
  },
  devServer: {
    static: {
      directory: path.join(__dirname, "dist"),
    },
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
    port: 3002,
    hot: true,
    historyApiFallback: true,
  },
};
