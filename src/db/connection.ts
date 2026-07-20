import type { PoolConfig } from 'pg';

type Env = NodeJS.ProcessEnv;

export function cleanEnvValue(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim() || undefined;
  }

  return trimmed;
}

export function isSupabaseHost(host: string | undefined): boolean {
  return Boolean(host?.includes('supabase.com') || host?.includes('supabase.co'));
}

function isSupabasePoolerHost(host: string | undefined): boolean {
  return Boolean(host?.endsWith('.pooler.supabase.com'));
}

function refFromSupabaseUrl(value: string | undefined): string | undefined {
  const cleaned = cleanEnvValue(value);
  if (!cleaned) return undefined;

  try {
    const url = new URL(cleaned);
    const match = url.hostname.match(/^([a-z0-9-]+)\.supabase\.co$/i);
    return match?.[1];
  } catch {
    return undefined;
  }
}

function refFromDirectDbHost(value: string | undefined): string | undefined {
  const cleaned = cleanEnvValue(value);
  const match = cleaned?.match(/^db\.([a-z0-9-]+)\.supabase\.co$/i);
  return match?.[1];
}

export function getSupabaseProjectRef(env: Env = process.env): string | undefined {
  return (
    cleanEnvValue(env.SUPABASE_PROJECT_REF) ||
    refFromSupabaseUrl(env.VITE_SUPABASE_URL) ||
    refFromSupabaseUrl(env.SUPABASE_URL) ||
    refFromSupabaseUrl(env.NEXT_PUBLIC_SUPABASE_URL) ||
    refFromDirectDbHost(env.SQL_HOST)
  );
}

function formatSupabasePoolerError(source: string): Error {
  return new Error(
    `${source} points at the Supabase pooler but does not include the project ref tenant in the database username. ` +
      `Use Supabase's Transaction pooler URI, where the username looks like "postgres.<project-ref>", ` +
      `or set SUPABASE_PROJECT_REF/VITE_SUPABASE_URL/SUPABASE_URL so the app can infer the project ref.`
  );
}

function needsSupabasePoolerTenant(username: string | undefined): boolean {
  return Boolean(username && !username.includes('.'));
}

export function normalizeSqlUserForHost(
  user: string | undefined,
  host: string | undefined,
  env: Env = process.env
): string | undefined {
  const cleanedUser = cleanEnvValue(user);
  const cleanedHost = cleanEnvValue(host);

  if (!isSupabasePoolerHost(cleanedHost) || !needsSupabasePoolerTenant(cleanedUser)) {
    return cleanedUser;
  }

  const projectRef = getSupabaseProjectRef(env);
  if (!projectRef) {
    throw formatSupabasePoolerError('SQL_HOST/SQL_USER');
  }

  return `${cleanedUser}.${projectRef}`;
}

export function normalizeDatabaseUrl(rawUrl: string, env: Env = process.env): string {
  const cleanedUrl = cleanEnvValue(rawUrl);
  if (!cleanedUrl) {
    throw new Error('DATABASE_URL is set but empty. Remove it or provide a PostgreSQL connection string.');
  }

  let url: URL;
  try {
    url = new URL(cleanedUrl);
  } catch {
    throw new Error('DATABASE_URL must be a valid PostgreSQL connection string.');
  }

  if (isSupabasePoolerHost(url.hostname) && needsSupabasePoolerTenant(url.username)) {
    const projectRef = getSupabaseProjectRef(env);
    if (!projectRef) {
      throw formatSupabasePoolerError('DATABASE_URL');
    }

    url.username = `${url.username}.${projectRef}`;
    return url.toString();
  }

  return cleanedUrl;
}

export function createPgPoolConfig(env: Env = process.env): PoolConfig {
  const poolOptions: PoolConfig = {
    max: env.VERCEL === '1' ? 1 : 10,
    connectionTimeoutMillis: 15000,
  };

  const databaseUrl = cleanEnvValue(env.DATABASE_URL);
  if (databaseUrl) {
    const connectionString = normalizeDatabaseUrl(databaseUrl, env);
    return {
      connectionString,
      ssl:
        isSupabaseHost(new URL(connectionString).hostname) || connectionString.includes('sslmode=require')
          ? { rejectUnauthorized: false }
          : undefined,
      ...poolOptions,
    };
  }

  const host = cleanEnvValue(env.SQL_HOST);
  const user = normalizeSqlUserForHost(env.SQL_USER, host, env);
  const password = cleanEnvValue(env.SQL_PASSWORD);
  const database = cleanEnvValue(env.SQL_DB_NAME);
  const missing = [
    ['SQL_HOST', host],
    ['SQL_USER', user],
    ['SQL_PASSWORD', password],
    ['SQL_DB_NAME', database],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length > 0) {
    throw new Error(`Missing PostgreSQL environment variables: ${missing.join(', ')}.`);
  }

  return {
    host,
    user,
    password,
    database,
    ssl: isSupabaseHost(host) ? { rejectUnauthorized: false } : undefined,
    ...poolOptions,
  };
}
