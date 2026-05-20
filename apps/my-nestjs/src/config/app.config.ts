import { registerAs, type ConfigType } from '@nestjs/config';

export type Environment = 'development' | 'test' | 'production';

export const appConfig = registerAs('app', () => ({
  // 端口避开前端段（3000=my-blog, 3001/3002/3003=qiankun 子应用）
  port: parseInt(process.env.PORT ?? '3100', 10),
  env: (process.env.NODE_ENV ?? 'development') as Environment,
  apiBaseUrl: process.env.API_BASE_URL ?? 'http://localhost:3100',
  logLevel: process.env.LOG_LEVEL ?? 'debug',
  isDev: process.env.NODE_ENV === 'development',
  isTest: process.env.NODE_ENV === 'test',
  isProd: process.env.NODE_ENV === 'production',
}));

export type AppConfig = ConfigType<typeof appConfig>;
