import { Column, Entity, ObjectIdColumn } from 'typeorm'

@Entity('roles')
export class RoleMongoEntity {
  @ObjectIdColumn()
  id!: string

  @Column()
  code!: string

  @Column()
  name!: string

  @Column()
  description!: string | null

  @Column()
  permissions!: string[]

  @Column()
  active!: boolean

  @Column()
  createdAt!: Date
}
