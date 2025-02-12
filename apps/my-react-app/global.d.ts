// 用于导入 .css 文件
declare module '*.css' {
  const content: string
  export default content
}

declare global {
  interface Window {
    __POWERED_BY_QIANKUN__: boolean
  }
}
