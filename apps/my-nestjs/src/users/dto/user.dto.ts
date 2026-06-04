export class UpdateUserDto {
  role?: string
  status?: 'active' | 'disabled'
  displayName?: string
}
