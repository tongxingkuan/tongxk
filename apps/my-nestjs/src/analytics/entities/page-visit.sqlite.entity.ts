import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm'

@Entity('page_visits')
export class PageVisitSqliteEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Index()
  @Column()
  path!: string

  @Column({ name: 'page_title', nullable: true, type: 'text' })
  pageTitle!: string | null

  /** 匿名访客标识（localStorage） */
  @Index()
  @Column({ name: 'visitor_id' })
  visitorId!: string

  @Index()
  @Column({ name: 'session_id' })
  sessionId!: string

  @Column({ name: 'user_id', nullable: true, type: 'text' })
  userId!: string | null

  @Column({ nullable: true, type: 'text' })
  referrer!: string | null

  @Column({ name: 'user_agent', nullable: true, type: 'text' })
  userAgent!: string | null

  @Column({ default: 'react-app' })
  source!: string

  @Index()
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date
}
