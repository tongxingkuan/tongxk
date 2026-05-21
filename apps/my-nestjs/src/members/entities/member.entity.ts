import { MemberMongoEntity } from './member.mongo.entity'
import { MemberSqliteEntity } from './member.sqlite.entity'

const isMongo = process.env.DB_TYPE === 'mongodb'

export const MemberEntity = isMongo ? MemberMongoEntity : MemberSqliteEntity
export type MemberEntity = InstanceType<typeof MemberEntity>
