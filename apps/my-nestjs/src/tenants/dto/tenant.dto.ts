export class CreateTenantDto {
  name!: string
  plan?: string
}

export class UpdateTenantDto {
  name?: string
  plan?: string
  active?: boolean
}
