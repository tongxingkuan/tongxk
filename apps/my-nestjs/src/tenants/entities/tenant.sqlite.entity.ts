import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm'

/**
 * 租户实体（关系库 / sqlite 版）。
 */
@Entity('tenants')
export class TenantSqliteEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ unique: true })
  name!: string

  @Column({ default: 'free' })
  plan!: string

  @Column({ default: true })
  active!: boolean

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date
}
