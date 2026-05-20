import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * 成员实体（sqlite）。
 * 通过 tenantId 实现行级隔离 —— 所有查询都必须基于 tenantId 过滤。
 */
@Entity('members')
@Index(['tenantId'])
export class MemberEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id' })
  tenantId!: string;

  @Column()
  name!: string;

  @Column()
  email!: string;

  /** owner / admin / member */
  @Column({ default: 'member' })
  role!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
