import { IsString, MinLength } from 'class-validator'

export class UpdateChatDto {
  @IsString()
  @MinLength(1, { message: '标题不能为空' })
  title!: string
}
