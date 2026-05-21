import { Column, Entity, ObjectId, ObjectIdColumn } from 'typeorm'

/**
 * 用户实体（MongoDB 版）。
 * 与 TenantMongoEntity 一样，直接把业务 id 存为 mongo 的 `_id`
 * （mongo 允许 _id 为任意 BSON 类型）。
 * 这样可避免 `_id`(ObjectId) + `id`(string) 双主键时常见的字段丢失问题，
 * 也让上层 service 与 sqlite 版完全一致地按 `id` 读写。
 *
 * 类型放宽为 `string | ObjectId`：
 *  - 写入时由 service 显式赋字符串 UUID
 *  - 读取时即使 mongo 历史数据是 ObjectId 也能兼容
 */
@Entity('users')
export class UserMongoEntity {
  @ObjectIdColumn()
  id!: string | ObjectId

  @Column()
  username!: string

  @Column()
  passwordHash!: string

  /** 'superadmin' | 'user' */
  @Column()
  role!: string

  @Column()
  createdAt!: Date
}
