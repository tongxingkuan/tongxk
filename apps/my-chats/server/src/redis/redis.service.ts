import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common'
import Redis from 'ioredis'
import { redisConfig, type RedisConfig } from '../config/redis.config'

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis

  constructor(@Inject(redisConfig.KEY) config: RedisConfig) {
    this.client = new Redis({ host: config.host, port: config.port })
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key)
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds)
    } else {
      await this.client.set(key, value)
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key)
  }

  /** 固定窗口计数：返回自增后的值，首次设置 TTL */
  async incrWithTtl(key: string, ttlSeconds: number): Promise<number> {
    const count = await this.client.incr(key)
    if (count === 1) {
      await this.client.expire(key, ttlSeconds)
    }
    return count
  }

  async exists(key: string): Promise<boolean> {
    return (await this.client.exists(key)) === 1
  }

  async delByPrefix(prefix: string): Promise<void> {
    const keys = await this.client.keys(`${prefix}*`)
    if (keys.length) await this.client.del(...keys)
  }

  onModuleDestroy(): void {
    void this.client.quit()
  }
}
