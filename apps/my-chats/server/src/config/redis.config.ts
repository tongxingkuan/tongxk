import { registerAs, type ConfigType } from '@nestjs/config'

export const redisConfig = registerAs('redis', () => ({
  host: process.env.REDIS_HOST ?? 'localhost',
  port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
}))

export type RedisConfig = ConfigType<typeof redisConfig>
