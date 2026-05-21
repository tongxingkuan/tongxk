import { Column, Entity, ObjectIdColumn } from 'typeorm'

/**
 * 租户实体（MongoDB 版）。
 * 直接把业务 id 存为 mongo 的 `_id`（mongo 允许 _id 为任意类型）。
 * 这样可避免 `_id`(ObjectId) + `id`(string) 双主键时常见的字段丢失问题，
 * 也让上层 service 与 sqlite 版完全一致地按 `id` 读写。
 */
@Entity('tenants')
export class TenantMongoEntity {
  @ObjectIdColumn()
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
