import { Column, Entity, Index, ObjectIdColumn } from 'typeorm'
import type { ObjectId } from 'mongodb'

/**
 * 成员实体（MongoDB 版）。tenantId 走业务字段，所有查询基于它做行级隔离。
 */
@Entity('members')
@Index(['tenantId'])
export class MemberMongoEntity {
  @ObjectIdColumn()
  _id!: ObjectId

  @Column()
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
