/**
 * 数据同步脚本：将本地 SQLite 中 cats 表的数据同步到生产 MongoDB。
 *
 * 用法：
 *   pnpm --filter my-nestjs sync:to-prod
 *
 * 环境变量来源：
 *   - .env.development        -> 源（SQLite）
 *   - .env.production.local   -> 目标（生产 MongoDB，包含真实凭据，本文件应加入 .gitignore）
 *     若不存在则 fallback 到 .env.production
 *
 * 必需变量：
 *   PROD_DB_URL    生产 MongoDB 连接串
 *   PROD_DB_NAME   生产 MongoDB 数据库名
 *
 * 同步策略：基于业务主键 id（uuid）做 upsert，幂等可重复运行。
 */
import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { DataSource } from 'typeorm';
import { CatSqliteEntity } from '../src/cats/entities/cat.sqlite.entity';
import { CatMongoEntity } from '../src/cats/entities/cat.mongo.entity';

const cwd = process.cwd();

// 1) 加载源（SQLite）配置
loadEnv({ path: resolve(cwd, '.env.development') });
const SQLITE_PATH = process.env.DB_DATABASE ?? 'data/dev.sqlite';

// 2) 加载目标（生产 MongoDB）配置：优先 .env.production.local
const prodLocal = resolve(cwd, '.env.production.local');
const prodFile = existsSync(prodLocal) ? prodLocal : resolve(cwd, '.env.production');
loadEnv({ path: prodFile, override: true });

const PROD_DB_URL = process.env.PROD_DB_URL ?? process.env.DB_URL;
const PROD_DB_NAME = process.env.PROD_DB_NAME ?? process.env.DB_NAME ?? 'my_nestjs_prod';

if (!PROD_DB_URL) {
  console.error('[sync] 缺少 PROD_DB_URL（或 DB_URL）。请在 .env.production.local 中配置。');
  process.exit(1);
}
const targetUrl: string = PROD_DB_URL;

async function main() {
  if (!existsSync(SQLITE_PATH)) {
    console.error(`[sync] SQLite 文件不存在：${SQLITE_PATH}`);
    process.exit(1);
  }

  const sqliteDS = new DataSource({
    type: 'better-sqlite3',
    database: SQLITE_PATH,
    entities: [CatSqliteEntity],
    synchronize: false,
  });

  const mongoDS = new DataSource({
    type: 'mongodb',
    url: targetUrl,
    database: PROD_DB_NAME,
    entities: [CatMongoEntity],
    synchronize: true, // 首次同步时建索引
  });

  await sqliteDS.initialize();
  await mongoDS.initialize();
  console.log(`[sync] 源 SQLite: ${SQLITE_PATH}`);
  console.log(`[sync] 目标 MongoDB: ${targetUrl.replace(/\/\/.*@/, '//***@')} / ${PROD_DB_NAME}`);

  const sqliteRepo = sqliteDS.getRepository(CatSqliteEntity);
  const mongoRepo = mongoDS.getMongoRepository(CatMongoEntity);

  const rows = await sqliteRepo.find();
  console.log(`[sync] SQLite 中读取到 ${rows.length} 条记录`);

  let upserted = 0;
  for (const row of rows) {
    const result = await mongoRepo.updateOne(
      { id: row.id },
      {
        $set: {
          id: row.id,
          name: row.name,
          age: row.age,
          breed: row.breed,
        },
      },
      { upsert: true },
    );
    if (result.upsertedCount || result.modifiedCount) upserted++;
  }
  console.log(`[sync] 已 upsert ${upserted} 条到 MongoDB（共扫描 ${rows.length} 条）`);

  await sqliteDS.destroy();
  await mongoDS.destroy();
  console.log('[sync] 完成');
}

main().catch((err) => {
  console.error('[sync] 失败：', err);
  process.exit(1);
});
