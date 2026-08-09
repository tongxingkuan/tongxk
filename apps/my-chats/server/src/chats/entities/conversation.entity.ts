import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { MessageEntity } from './message.entity'

@Entity('conversations')
export class ConversationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ name: 'user_id' })
  userId!: string

  @Column({ default: '新对话' })
  title!: string

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date

  @OneToMany(() => MessageEntity, m => m.conversation, {
    cascade: true,
    eager: false,
  })
  messages!: MessageEntity[]
}
