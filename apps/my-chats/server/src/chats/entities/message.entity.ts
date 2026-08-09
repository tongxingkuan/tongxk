import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { ConversationEntity } from './conversation.entity'

@Entity('messages')
export class MessageEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ name: 'conversation_id' })
  conversationId!: string

  @Column()
  role!: 'user' | 'assistant'

  /** 生成状态：generating 流式生成中 / done 完成（含 user 消息） */
  @Column({ default: 'done' })
  status!: 'generating' | 'done'

  @Column('text')
  content!: string

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  @ManyToOne(() => ConversationEntity, c => c.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversation_id' })
  conversation!: ConversationEntity
}
