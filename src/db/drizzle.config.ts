import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";
import {
  cleanEnvValue,
  getSupabaseProjectRef,
  isSupabaseHost,
  normalizeDatabaseUrl,
  normalizeSqlUserForHost,
} from "./connection.ts";

dotenv.config();

const databaseUrl = cleanEnvValue(process.env.DATABASE_URL);
const supabaseDbPassword = cleanEnvValue(process.env.SUPABASE_DB_PASSWORD);
const sqlHost = cleanEnvValue(process.env.SQL_HOST);
const usePostgres = Boolean(supabaseDbPassword || databaseUrl || sqlHost);

const sqliteConfig = defineConfig({
  schema: "./src/db/schema.sqlite.ts",
  out: "./drizzle-sqlite",
  dialect: "sqlite",
  dbCredentials: {
    url: "./data/habit_mountain.db",
  },
  verbose: true,
});

const supabaseHost =
  cleanEnvValue(process.env.SUPABASE_DB_HOST) ||
  (getSupabaseProjectRef() ? `db.${getSupabaseProjectRef()}.supabase.co` : undefined);
const supabasePort = Number(cleanEnvValue(process.env.SUPABASE_DB_PORT)) || 5432;

const postgresConfig = databaseUrl
  ? defineConfig({
      schema: "./src/db/schema.pg.ts",
      out: "./drizzle",
      dialect: "postgresql",
      schemaFilter: ["public"],
      dbCredentials: {
        url: normalizeDatabaseUrl(databaseUrl),
      },
      verbose: true,
    })
  : supabaseDbPassword
    ? defineConfig({
        schema: "./src/db/schema.pg.ts",
        out: "./drizzle",
        dialect: "postgresql",
        schemaFilter: ["public"],
        dbCredentials: {
          host: supabaseHost!,
          port: supabasePort,
          user: normalizeSqlUserForHost(cleanEnvValue(process.env.SUPABASE_DB_USER) || "postgres", supabaseHost)!,
          password: supabaseDbPassword,
          database: cleanEnvValue(process.env.SUPABASE_DB_NAME) || "postgres",
          ssl: { rejectUnauthorized: false },
        },
        verbose: true,
      })
    : defineConfig({
        schema: "./src/db/schema.pg.ts",
        out: "./drizzle",
        dialect: "postgresql",
        schemaFilter: ["public"],
        dbCredentials: {
          host: sqlHost!,
          user: normalizeSqlUserForHost(process.env.SQL_ADMIN_USER || process.env.SQL_USER, sqlHost)!,
          password: cleanEnvValue(process.env.SQL_ADMIN_PASSWORD || process.env.SQL_PASSWORD)!,
          database: cleanEnvValue(process.env.SQL_DB_NAME)!,
          ssl: isSupabaseHost(sqlHost) ? { rejectUnauthorized: false } : false,
        },
        verbose: true,
      });

export default usePostgres ? postgresConfig : sqliteConfig;