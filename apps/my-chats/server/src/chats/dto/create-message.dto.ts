import { IsOptional, IsString, MinLength } from 'class-validator'

export class CreateMessageDto {
  @IsString()
  @MinLength(1, { message: '消息内容不能为空' })
  content!: string

  /** 角色预设 key（见 CHARACTERS），可选，用于注入系统提示词 */
  @IsOptional()
  @IsString()
  character?: string
}
