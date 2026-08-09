import { eslintPreset } from 'preset'

// 复用根 preset（与 my-vite-app 一致），仅将类型检查的 project 指向 server 的 tsconfig
export default eslintPreset().map(config => {
  if (config.languageOptions?.parserOptions?.project) {
    config.languageOptions.parserOptions.project = './tsconfig.json'
  }
  return config
})
