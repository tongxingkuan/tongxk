import { ObjectId } from 'mongodb'

/**
 * 在 mongodb 驱动下把字符串 id 转成 `{ _id: ObjectId }` 形式，
 * 在 sqlite 驱动下保留 `{ id }`。
 *
 * 背景：本项目 mongo 实体用 `@ObjectIdColumn()`，DB 里 `_id` 实际是 ObjectId；
 * 直接用 `findOne({ where: { id } })` 传 string 不会被自动转型，导致查不到记录、
 * 上层抛 404（如 DELETE /tenants/:id 失败）。
 *
 * 非法 ObjectId（长度/字符不合法）时返回一个临时生成的 ObjectId，
 * 保证不会匹配任何已有记录，让上层走标准的 NotFoundException 分支。
 */
const isMongo = process.env.DB_TYPE === 'mongodb'

export function idWhere(id: string): Record<string, unknown> {
  if (!isMongo) return { id }
  if (!ObjectId.isValid(id)) return { _id: new ObjectId() }
  return { _id: new ObjectId(id) }
}
