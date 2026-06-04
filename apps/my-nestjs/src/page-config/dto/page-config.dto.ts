export class CreatePageConfigDto {
  key!: string
  group!: string
  label!: string
  value?: Record<string, unknown>
  enabled?: boolean
  description?: string
}

export class UpdatePageConfigDto {
  group?: string
  label?: string
  value?: Record<string, unknown>
  enabled?: boolean
  description?: string
}
