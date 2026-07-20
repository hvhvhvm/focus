import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";
import {
  cleanEnvValue,
  isSupabaseHost,
  normalizeDatabaseUrl,
  normalizeSqlUserForHost,
} from "./connection.ts";

dotenv.config();

const databaseUrl = cleanEnvValue(process.env.DATABASE_URL);
const sqlHost = cleanEnvValue(process.env.SQL_HOST);
const usePostgres = Boolean(databaseUrl || sqlHost);

const sqliteConfig = defineConfig({
  schema: "./src/db/schema.sqlite.ts",
  out: "./drizzle-sqlite",
  dialect: "sqlite",
  dbCredentials: {
    url: "./data/habit_mountain.db",
  },
  verbose: true,
});

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
