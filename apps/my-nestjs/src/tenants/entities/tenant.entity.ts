import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * 租户实体（sqlite）。
 * 多租户系统的"账户"，每个租户拥有独立的成员与资源。
 */
@Entity('tenants')
export class TenantEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  name!: string;

  /** 计费/规模档位：free / pro / enterprise */
  @Column({ default: 'free' })
  plan!: string;

  /** 是否启用 */
  @Column({ default: true })
  active!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
