import { registerAs, type ConfigType } from '@nestjs/config'

export type DbType = 'sqlite' | 'mongodb'

export const databaseConfig = registerAs('database', () => ({
  type: (process.env.DB_TYPE ?? 'sqlite') as DbType,
  // sqlite: 本地文件路径
  database: process.env.DB_DATABASE ?? 'data/dev.sqlite',
  // mongodb
  url: process.env.DB_URL ?? 'mongodb://localhost:27017',
  mongoDatabase: process.env.DB_NAME ?? 'my_nestjs',
  // 公共
  synchronize: process.env.DB_SYNCHRONIZE !== 'false',
  logging: process.env.DB_LOGGING === 'true',
}))

export type DatabaseConfig = ConfigType<typeof databaseConfig>
