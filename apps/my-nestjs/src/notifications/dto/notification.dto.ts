export class CreateNotificationDto {
  title!: string
  content!: string
  type?: string
  targetRoles?: string[]
  targetUserIds?: string[]
  priority?: number
  link?: string
  expiresAt?: string
}

export class UpdateNotificationDto {
  title?: string
  content?: string
  type?: string
  targetRoles?: string[]
  targetUserIds?: string[]
  priority?: number
  link?: string
  expiresAt?: string | null
}

export class MarkReadDto {
  notificationIds!: string[]
  visitorId?: string
}
