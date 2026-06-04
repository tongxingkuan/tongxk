export class CreateRoleDto {
  code!: string
  name!: string
  description?: string
  permissions?: string[]
  active?: boolean
}

export class UpdateRoleDto {
  name?: string
  description?: string
  permissions?: string[]
  active?: boolean
}
