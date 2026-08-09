import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { IsBoolean } from 'class-validator'
import { CurrentUser } from '../common/current-user.decorator'
import type { RequestUser } from '../common/current-user.decorator'
import { KnowledgeService } from './knowledge.service'

class RagEnabledDto {
  @IsBoolean()
  enabled!: boolean
}

@Controller('knowledge')
export class KnowledgeController {
  constructor(private readonly knowledge: KnowledgeService) {}

  // ---- 知识库 CRUD ----

  @Get('bases')
  listBases(@CurrentUser() user: RequestUser) {
    return this.knowledge.listBases(user.id)
  }

  @Post('bases')
  createBase(@CurrentUser() user: RequestUser, @Body('name') name: string) {
    if (!name?.trim()) throw new BadRequestException('知识库名称不能为空')
    return this.knowledge.createBase(user.id, name.trim())
  }

  @Delete('bases/:baseId')
  @HttpCode(204)
  removeBase(@CurrentUser() user: RequestUser, @Param('baseId') baseId: string) {
    return this.knowledge.deleteBase(user.id, baseId)
  }

  // ---- 文档上传 ----

  /** 上传 .md/.txt 文档到指定知识库：切块 → 向量化 → 入库 */
  @Post('bases/:baseId/documents')
  @HttpCode(200)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (/\.(md|txt)$/i.test(file.originalname)) cb(null, true)
        else cb(new BadRequestException('仅支持 .md/.txt 文件'), false)
      },
    }),
  )
  async upload(
    @CurrentUser() user: RequestUser,
    @Param('baseId') baseId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('未提供文件')
    const content = file.buffer.toString('utf-8')
    const chunks = await this.knowledge.indexDocument(user.id, baseId, file.originalname, content)
    return { filename: file.originalname, chunks }
  }

  // ---- RAG 全局开关 ----

  @Get('rag')
  async getRag(@CurrentUser() user: RequestUser) {
    return { enabled: await this.knowledge.getRagEnabled(user.id) }
  }

  @Put('rag')
  async setRag(@CurrentUser() user: RequestUser, @Body() dto: RagEnabledDto) {
    await this.knowledge.setRagEnabled(user.id, dto.enabled)
    return { enabled: dto.enabled }
  }
}
