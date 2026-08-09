import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity('knowledge_bases')
export class KnowledgeBaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ name: 'user_id' })
  userId!: string

  @Column()
  name!: string

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date
}
