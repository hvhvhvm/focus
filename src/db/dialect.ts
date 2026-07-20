import { cleanEnvValue } from './connection.ts';

export const usePostgres = Boolean(
  process.env.VERCEL === '1' || cleanEnvValue(process.env.DATABASE_URL) || cleanEnvValue(process.env.SQL_HOST)
);
