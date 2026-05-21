import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { CreateTenantDto, UpdateTenantDto } from './dto/tenant.dto'
import { TenantEntity } from './entities/tenant.entity'

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(TenantEntity)
    private readonly tenantsRepo: Repository<TenantEntity>,
  ) {}

  async findAll(): Promise<TenantEntity[]> {
    return this.tenantsRepo.find({ order: { createdAt: 'DESC' } })
  }

  async findOne(id: string): Promise<TenantEntity> {
    const tenant = await this.tenantsRepo.findOne({ where: { id } })
    if (!tenant) throw new NotFoundException(`租户 ${id} 不存在`)
    return tenant
  }

  async create(dto: CreateTenantDto): Promise<TenantEntity> {
    const exists = await this.tenantsRepo.findOne({
      where: { name: dto.name },
    })
    if (exists) throw new ConflictException(`租户名 "${dto.name}" 已存在`)
    // 不显式赋 id：mongo 由 @ObjectIdColumn 自动生成 ObjectId，sqlite 由 @PrimaryGeneratedColumn('uuid') 自动生成 UUID
    const tenant = this.tenantsRepo.create({
      name: dto.name,
      plan: dto.plan ?? 'free',
      active: true,
      createdAt: new Date(),
    })
    return this.tenantsRepo.save(tenant)
  }

  async update(id: string, dto: UpdateTenantDto): Promise<TenantEntity> {
    const tenant = await this.findOne(id)
    Object.assign(tenant, dto)
    return this.tenantsRepo.save(tenant)
  }

  async remove(id: string): Promise<{ id: string }> {
    const tenant = await this.findOne(id)
    await this.tenantsRepo.remove(tenant)
    return { id }
  }
}
