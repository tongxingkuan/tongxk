/**
 * ID 生成工具函数
 */

let id = 0

/**
 * 创建字符串 ID
 * @param prefix 前缀
 * @returns 字符串 ID
 * @example
 * ```ts
 * createStringId() // "1"
 * createStringId('user') // "user-1"
 * ```
 */
export const createStringId = (prefix = '') => {
  id += 1
  return prefix ? `${prefix}-${id}` : id.toString()
}

/**
 * 创建数字 ID
 * @returns 数字 ID
 * @example
 * ```ts
 * createNumberId() // 1
 * createNumberId() // 2
 * ```
 */
export const createNumberId = () => {
  id += 1
  return id
}

/**
 * 重置 ID 计数器
 * @param startValue 起始值
 */
export const resetId = (startValue = 0) => {
  id = startValue
}

/**
 * 生成 UUID
 * @returns UUID 字符串
 */
export const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * 生成短 UUID
 * @returns 短 UUID 字符串
 */
export const generateShortUUID = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}
