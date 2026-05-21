import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  // 允许跨域：方便 my-blog 等前端 demo 直接访问
  app.enableCors({
    origin: true,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id'],
  })
  // 生产环境只监听回环地址，对外由 Nginx (3100/SSL) 反向代理到本地 3101
  // 开发环境监听 0.0.0.0 方便手机/同网调试
  const port = Number(process.env.PORT ?? 3100)
  const host = process.env.NODE_ENV === 'production' ? '127.0.0.1' : '0.0.0.0'
  await app.listen(port, host)
}
void bootstrap()
