import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

@Entity('page_configs')
export class PageConfigSqliteEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ unique: true })
  key!: string

  @Column()
  group!: string

  @Column()
  label!: string

  @Column({ type: 'simple-json', default: '{}' })
  value!: Record<string, unknown>

  @Column({ default: true })
  enabled!: boolean

  @Column({ nullable: true, type: 'text' })
  description!: string | null

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date
}
