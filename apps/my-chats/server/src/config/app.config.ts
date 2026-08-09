import { registerAs, type ConfigType } from '@nestjs/config'

export type Environment = 'development' | 'test' | 'production'

export const appConfig = registerAs('app', () => ({
  port: parseInt(process.env.PORT ?? '3200', 10),
  env: (process.env.NODE_ENV ?? 'development') as Environment,
  isDev: process.env.NODE_ENV !== 'production',
}))

export type AppConfig = ConfigType<typeof appConfig>
