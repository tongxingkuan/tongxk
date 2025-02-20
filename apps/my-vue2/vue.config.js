const { name } = require("./package.json");

/**
 * @type {import('@vue/cli-service').ProjectOptions}
 */
module.exports = {
  // options...
  devServer: {
    port: 3003,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  },
  configureWebpack: {
    output: {
      library: `${name}-[name]`,
      libraryTarget: "umd",
      // webpack 5 需要把 jsonpFunction 替换成 chunkLoadingGlobal
      jsonpFunction: `webpackJsonp_${name}`,
    },
  },
};
