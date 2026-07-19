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

const sqlHost = process.env.SQL_HOST;
const sqlDbName = process.env.SQL_DB_NAME;
const user = process.env.SQL_ADMIN_USER;
const password = process.env.SQL_ADMIN_PASSWORD;

const postgresConfig = defineConfig({
  schema: "./src/db/schema.pg.ts",
  out: "./drizzle",
  dialect: "postgresql",
  schemaFilter: ["public"],
  dbCredentials: {
    host: sqlHost!,
    user: user!,
    password: password!,
    database: sqlDbName!,
    ssl: false,
  },
  verbose: true,
});

export default usePostgres ? postgresConfig : sqliteConfig;
