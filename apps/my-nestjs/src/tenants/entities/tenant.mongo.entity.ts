import { Column, Entity, ObjectIdColumn } from 'typeorm'
import type { ObjectId } from 'mongodb'

/**
 * 租户实体（MongoDB 版）。
 * 使用 ObjectId 作为主键；对外仍以字符串形式返回（toJSON 默认会序列化）。
 */
@Entity('tenants')
export class TenantMongoEntity {
  @ObjectIdColumn()
  _id!: ObjectId

  /** 与 sqlite 版字段名保持一致，便于上层无感切换。 */
  @Column()
  id!: string

  @Column()
  name!: string

  @Column()
  plan!: string

  @Column()
  active!: boolean

  @Column()
  createdAt!: Date
}
