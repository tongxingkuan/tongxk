import { Column, Entity, ObjectIdColumn } from 'typeorm'

@Entity('page_configs')
export class PageConfigMongoEntity {
  @ObjectIdColumn()
  id!: string

  @Column()
  key!: string

  @Column()
  group!: string

  @Column()
  label!: string

  @Column()
  value!: Record<string, unknown>

  @Column()
  enabled!: boolean

  @Column()
  description!: string | null

  @Column()
  createdAt!: Date

  @Column()
  updatedAt!: Date
}
