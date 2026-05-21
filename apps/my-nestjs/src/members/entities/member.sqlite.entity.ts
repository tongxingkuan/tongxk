import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm'

/**
 * 成员实体（关系库 / sqlite 版）。
 */
@Entity('members')
@Index(['tenantId'])
export class MemberSqliteEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ name: 'tenant_id' })
  tenantId!: string

  @Column()
  name!: string

  @Column()
  email!: string

  @Column({ default: 'member' })
  role!: string

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date
}
