import { Column, Entity, Index, ObjectIdColumn } from 'typeorm'

/**
 * 成员实体（MongoDB 版）。
 * 同 Tenant：业务 id 直接存为 mongo 的 _id，简化字段映射。
 * tenantId 走业务字段，所有查询基于它做行级隔离。
 */
@Entity('members')
@Index(['tenantId'])
export class MemberMongoEntity {
  @ObjectIdColumn()
  id!: string

  @Column()
  tenantId!: string

  @Column()
  name!: string

  @Column()
  email!: string

  @Column()
  role!: string

  @Column()
  createdAt!: Date
}
