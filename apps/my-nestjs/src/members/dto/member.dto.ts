export class CreateMemberDto {
  name!: string;
  email!: string;
  role?: string;
}

export class UpdateMemberDto {
  name?: string;
  email?: string;
  role?: string;
}
