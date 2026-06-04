import { Column, Entity, ObjectIdColumn } from 'typeorm'

@Entity('page_visits')
export class PageVisitMongoEntity {
  @ObjectIdColumn()
  id!: string

  @Column()
  path!: string

  @Column()
  pageTitle!: string | null

  @Column()
  visitorId!: string

  @Column()
  sessionId!: string

  @Column()
  userId!: string | null

  @Column()
  referrer!: string | null

  @Column()
  userAgent!: string | null

  @Column()
  source!: string

  @Column()
  createdAt!: Date
}
