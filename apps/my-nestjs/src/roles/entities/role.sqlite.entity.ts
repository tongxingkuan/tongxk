import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm'

@Entity('roles')
export class RoleSqliteEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ unique: true })
  code!: string

  @Column()
  name!: string

  @Column({ type: 'text', nullable: true })
  description!: string | null

  /** JSON 数组，如 ["users:read","users:write"] */
  @Column({ type: 'simple-json', default: '[]' })
  permissions!: string[]

  @Column({ default: true })
  active!: boolean

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date
}
