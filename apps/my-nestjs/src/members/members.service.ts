import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { TenantsService } from '../tenants/tenants.service'
import { CreateMemberDto, UpdateMemberDto } from './dto/member.dto'
import { MemberEntity } from './entities/member.entity'

@Injectable()
export class MembersService {
  constructor(
    @InjectRepository(MemberEntity)
    private readonly membersRepo: Repository<MemberEntity>,
    private readonly tenantsService: TenantsService,
  ) {}

  async findAll(tenantId: string): Promise<MemberEntity[]> {
    return this.membersRepo.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    })
  }

  async findOne(tenantId: string, id: string): Promise<MemberEntity> {
    const member = await this.membersRepo.findOne({ where: { id, tenantId } })
    if (!member) throw new NotFoundException(`成员 ${id} 不存在于当前租户`)
    return member
  }

  async create(tenantId: string, dto: CreateMemberDto): Promise<MemberEntity> {
    // 校验租户存在
    await this.tenantsService.findOne(tenantId)
    const member = this.membersRepo.create({
      tenantId,
      name: dto.name,
      email: dto.email,
      role: dto.role ?? 'member',
      createdAt: new Date(),
    })
    return this.membersRepo.save(member)
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateMemberDto,
  ): Promise<MemberEntity> {
    const member = await this.findOne(tenantId, id)
    Object.assign(member, dto)
    return this.membersRepo.save(member)
  }

  async remove(tenantId: string, id: string): Promise<{ id: string }> {
    const member = await this.findOne(tenantId, id)
    await this.membersRepo.remove(member)
    return { id }
  }
}
