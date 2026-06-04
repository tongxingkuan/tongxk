import {
  NotificationMongoEntity,
  NotificationReadMongoEntity,
} from './notification.mongo.entity'
import {
  NotificationReadSqliteEntity,
  NotificationSqliteEntity,
} from './notification.sqlite.entity'

const isMongo = process.env.DB_TYPE === 'mongodb'

export const NotificationEntity = isMongo
  ? NotificationMongoEntity
  : NotificationSqliteEntity
export type NotificationEntity = InstanceType<typeof NotificationEntity>

export const NotificationReadEntity = isMongo
  ? NotificationReadMongoEntity
  : NotificationReadSqliteEntity
export type NotificationReadEntity = InstanceType<
  typeof NotificationReadEntity
>
