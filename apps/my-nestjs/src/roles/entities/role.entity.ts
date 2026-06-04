import { RoleMongoEntity } from './role.mongo.entity'
import { RoleSqliteEntity } from './role.sqlite.entity'

const isMongo = process.env.DB_TYPE === 'mongodb'

export const RoleEntity = isMongo ? RoleMongoEntity : RoleSqliteEntity
export type RoleEntity = InstanceType<typeof RoleEntity>
