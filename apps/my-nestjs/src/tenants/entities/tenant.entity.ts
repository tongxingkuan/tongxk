import { TenantMongoEntity } from './tenant.mongo.entity'
import { TenantSqliteEntity } from './tenant.sqlite.entity'

/**
 * 根据 DB_TYPE 在运行时选择实体类。
 * - sqlite（默认）：使用关系库版
 * - mongodb：使用 ObjectId 版
 */
const isMongo = process.env.DB_TYPE === 'mongodb'

export const TenantEntity = isMongo ? TenantMongoEntity : TenantSqliteEntity
export type TenantEntity = InstanceType<typeof TenantEntity>
