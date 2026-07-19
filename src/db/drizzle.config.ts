import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config();

const usePostgres = Boolean(
  (process.env.DATABASE_URL && process.env.DATABASE_URL.length > 0) ||
  (process.env.SQL_HOST && process.env.SQL_HOST.length > 0)
);

const sqliteConfig = defineConfig({
  schema: "./src/db/schema.sqlite.ts",
  out: "./drizzle-sqlite",
  dialect: "sqlite",
  dbCredentials: {
    url: "./data/habit_mountain.db",
  },
  verbose: true,
});

const postgresConfig = process.env.DATABASE_URL
  ? defineConfig({
      schema: "./src/db/schema.pg.ts",
      out: "./drizzle",
      dialect: "postgresql",
      schemaFilter: ["public"],
      dbCredentials: {
        url: process.env.DATABASE_URL,
      },
      verbose: true,
    })
  : defineConfig({
      schema: "./src/db/schema.pg.ts",
      out: "./drizzle",
      dialect: "postgresql",
      schemaFilter: ["public"],
      dbCredentials: {
        host: process.env.SQL_HOST!,
        user: process.env.SQL_ADMIN_USER!,
        password: process.env.SQL_ADMIN_PASSWORD!,
        database: process.env.SQL_DB_NAME!,
        ssl: process.env.SQL_HOST?.includes("supabase")
          ? { rejectUnauthorized: false }
          : false,
      },
      verbose: true,
    });

export default usePostgres ? postgresConfig : sqliteConfig;
