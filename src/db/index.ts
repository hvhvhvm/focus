import dotenv from 'dotenv';
dotenv.config();

import path from 'path';
import fs from 'fs';
import { createRequire } from 'module';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { Pool } from 'pg';
import { usePostgres } from './dialect.ts';
import * as pgSchema from './schema.pg.ts';
import * as sqliteSchema from './schema.sqlite.ts';
import { initPgDatabase } from './init-pg.ts';
import { createPgPoolConfig } from './connection.ts';

const require = createRequire(import.meta.url);

export { usePostgres };

export type AppDb = BetterSQLite3Database<typeof sqliteSchema>;

export const createPool = () => {
  return new Pool(createPgPoolConfig());
};

function createSqliteDb(): AppDb {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.join(dataDir, 'habit_mountain.db');
  const { initSqliteDatabase } = require('./init-sqlite.ts') as typeof import('./init-sqlite.ts');
  const { drizzle: drizzleSqlite } = require('drizzle-orm/better-sqlite3') as typeof import('drizzle-orm/better-sqlite3');
  const sqlite = initSqliteDatabase(dbPath);
  console.log(`Using local SQLite database at ${dbPath}`);
  return drizzleSqlite(sqlite, { schema: sqliteSchema });
}

async function createPostgresDb(): Promise<AppDb> {
  if (process.env.VERCEL === '1' && !process.env.DATABASE_URL && !process.env.SQL_HOST) {
    throw new Error(
      'DATABASE_URL must be set in Vercel environment variables. SQLite is not supported on serverless deployments.'
    );
  }

  const pool = createPool();
  pool.on('error', (err) => {
    console.error('Unexpected error on idle SQL pool client:', err);
  });

  await initPgDatabase(pool);
  console.log('Connected to PostgreSQL.');
  return drizzlePg(pool, { schema: pgSchema }) as unknown as AppDb;
}

export const db: AppDb = usePostgres ? await createPostgresDb() : createSqliteDb();

