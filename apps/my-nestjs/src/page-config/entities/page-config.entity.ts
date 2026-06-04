import { PageConfigMongoEntity } from './page-config.mongo.entity'
import { PageConfigSqliteEntity } from './page-config.sqlite.entity'

const isMongo = process.env.DB_TYPE === 'mongodb'

export const PageConfigEntity = isMongo
  ? PageConfigMongoEntity
  : PageConfigSqliteEntity
export type PageConfigEntity = InstanceType<typeof PageConfigEntity>
