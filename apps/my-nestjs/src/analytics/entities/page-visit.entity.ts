import { PageVisitMongoEntity } from './page-visit.mongo.entity'
import { PageVisitSqliteEntity } from './page-visit.sqlite.entity'

const isMongo = process.env.DB_TYPE === 'mongodb'

export const PageVisitEntity = isMongo
  ? PageVisitMongoEntity
  : PageVisitSqliteEntity
export type PageVisitEntity = InstanceType<typeof PageVisitEntity>
