import { Column, Entity, ObjectIdColumn } from 'typeorm'

@Entity('users')
export class UserMongoEntity {
  @ObjectIdColumn()
  id!: string

  @Column()
  username!: string

  @Column()
  passwordHash!: string

  /** 'superadmin' | 'user' */
  @Column()
  role!: string

  @Column()
  createdAt!: Date
}
