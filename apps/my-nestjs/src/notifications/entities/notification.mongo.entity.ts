import { Column, Entity, ObjectIdColumn } from 'typeorm'

@Entity('notifications')
export class NotificationMongoEntity {
  @ObjectIdColumn()
  id!: string

  @Column()
  title!: string

  @Column()
  content!: string

  @Column()
  type!: string

  @Column()
  targetRoles!: string[]

  @Column()
  targetUserIds!: string[]

  @Column()
  priority!: number

  @Column()
  link!: string | null

  @Column()
  expiresAt!: Date | null

  @Column()
  createdAt!: Date
}

@Entity('notification_reads')
export class NotificationReadMongoEntity {
  @ObjectIdColumn()
  id!: string

  @Column()
  notificationId!: string

  @Column()
  userId!: string | null

  @Column()
  visitorId!: string | null

  @Column()
  readAt!: Date
}
