import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm'

@Entity('notifications')
export class NotificationSqliteEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column()
  title!: string

  @Column({ type: 'text' })
  content!: string

  /** system | promo | info | recommend */
  @Column({ default: 'info' })
  type!: string

  /** 目标角色编码，空数组表示全部 */
  @Column({ name: 'target_roles', type: 'simple-json', default: '[]' })
  targetRoles!: string[]

  /** 指定用户 id，空数组表示不限制 */
  @Column({ name: 'target_user_ids', type: 'simple-json', default: '[]' })
  targetUserIds!: string[]

  @Column({ default: 0 })
  priority!: number

  @Column({ nullable: true, type: 'text' })
  link!: string | null

  @Column({ name: 'expires_at', nullable: true, type: 'datetime' })
  expiresAt!: Date | null

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date
}

@Entity('notification_reads')
export class NotificationReadSqliteEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ name: 'notification_id' })
  notificationId!: string

  @Column({ name: 'user_id', nullable: true, type: 'text' })
  userId!: string | null

  @Column({ name: 'visitor_id', nullable: true, type: 'text' })
  visitorId!: string | null

  @CreateDateColumn({ name: 'read_at' })
  readAt!: Date
}
