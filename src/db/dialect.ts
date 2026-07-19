export const usePostgres = Boolean(
  process.env.VERCEL === "1" ||
  (process.env.DATABASE_URL && process.env.DATABASE_URL.length > 0) ||
  (process.env.SQL_HOST && process.env.SQL_HOST.length > 0)
);
