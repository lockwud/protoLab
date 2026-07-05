import { Pool, type QueryResultRow } from "pg";
import { env, featureFlags } from "./env";

// A single shared pg Pool across hot-reloads in dev.
declare global {
  var __protolabPool: Pool | undefined;
}

function createPool(): Pool {
  if (!featureFlags.databaseConfigured) {
    throw new Error(
      "DATABASE_URL is not configured. Copy .env.example to .env and point it at your Postgres instance."
    );
  }
  return new Pool({ connectionString: env.DATABASE_URL, max: 10 });
}

export function getPool(): Pool {
  if (!global.__protolabPool) {
    global.__protolabPool = createPool();
  }
  return global.__protolabPool;
}

export class DatabaseUnavailableError extends Error {
  constructor(cause?: unknown) {
    super("The database is currently unavailable. Please check your Postgres connection.");
    this.name = "DatabaseUnavailableError";
    if (cause) this.cause = cause;
  }
}

// Thin query helper with graceful-failure semantics (module #: resilience).
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  try {
    const pool = getPool();
    const result = await pool.query<T>(text, params as never[]);
    return result.rows;
  } catch (err) {
    if (!featureFlags.databaseConfigured) {
      throw new DatabaseUnavailableError(err);
    }
    // Connection-level failures (ECONNREFUSED etc.) -> normalize to a clear error
    const message = err instanceof Error ? err.message : String(err);
    if (/ECONNREFUSED|ENOTFOUND|timeout|does not exist/i.test(message)) {
      throw new DatabaseUnavailableError(err);
    }
    throw err;
  }
}

export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}
