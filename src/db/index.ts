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

const require = createRequire(import.meta.url);

export { usePostgres };

export type AppDb = BetterSQLite3Database<typeof sqliteSchema>;

function isSupabaseUrl(url: string): boolean {
  return url.includes('supabase.com') || url.includes('supabase.co');
}

export const createPool = () => {
  const poolOptions = {
    max: process.env.VERCEL === '1' ? 1 : 10,
    connectionTimeoutMillis: 15000,
  };

  if (process.env.DATABASE_URL && process.env.DATABASE_URL.length > 0) {
    const connectionString = process.env.DATABASE_URL;
    return new Pool({
      connectionString,
      ssl: isSupabaseUrl(connectionString) || connectionString.includes('sslmode=require')
        ? { rejectUnauthorized: false }
        : undefined,
      ...poolOptions,
    });
  }

  return new Pool({
    host: process.env.SQL_HOST,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DB_NAME,
    ssl: process.env.SQL_HOST?.includes('supabase')
      ? { rejectUnauthorized: false }
      : undefined,
    ...poolOptions,
  });
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
