import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ unique: true })
  username!: string

  /** 默认不查询出来，登录时显式 select */
  @Column({ name: 'password_hash', select: false })
  passwordHash!: string

  /** 知识库检索全局开关（用户偏好） */
  @Column({ name: 'rag_enabled', default: false })
  ragEnabled!: boolean

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date
}
