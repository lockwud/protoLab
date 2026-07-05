// Centralized, safe environment validation.
// Missing optional keys (AI/GitHub) disable only that feature instead of crashing the app.

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable "${name}". Copy .env.example to .env and fill it in.`
    );
  }
  return value;
}

export const env = {
  DATABASE_URL: process.env.DATABASE_URL ?? "",
  JWT_SECRET: process.env.JWT_SECRET ?? "dev-insecure-secret-change-me",
  CLAUDE_API_KEY: process.env.CLAUDE_API_KEY ?? "",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY ?? "",
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID ?? "",
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET ?? "",
  GITHUB_TOKEN: process.env.GITHUB_TOKEN ?? "",
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
};

export const featureFlags = {
  aiEnabled: Boolean(env.CLAUDE_API_KEY || env.GEMINI_API_KEY),
  githubEnabled: Boolean(env.GITHUB_TOKEN || (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET)),
  databaseConfigured: Boolean(env.DATABASE_URL),
};

export function assertDatabaseConfigured() {
  if (!featureFlags.databaseConfigured) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env, start Postgres, and set DATABASE_URL."
    );
  }
}

export { required };
