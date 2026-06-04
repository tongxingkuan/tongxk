import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm'

@Entity('users')
export class UserSqliteEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ unique: true })
  username!: string

  @Column({ name: 'password_hash' })
  passwordHash!: string

  /** 角色编码，对应 roles.code */
  @Column({ default: 'user' })
  role!: string

  @Column({ default: 'active' })
  status!: string

  @Column({ name: 'display_name', nullable: true, type: 'text' })
  displayName!: string | null

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date
}
