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

  /** 'superadmin' | 'user' */
  @Column({ default: 'user' })
  role!: string

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date
}
