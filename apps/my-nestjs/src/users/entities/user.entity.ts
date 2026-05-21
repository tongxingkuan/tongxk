import { UserMongoEntity } from './user.mongo.entity'
import { UserSqliteEntity } from './user.sqlite.entity'

const isMongo = process.env.DB_TYPE === 'mongodb'

export const UserEntity = isMongo ? UserMongoEntity : UserSqliteEntity
export type UserEntity = InstanceType<typeof UserEntity>
