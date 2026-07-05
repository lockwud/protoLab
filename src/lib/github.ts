import { Octokit } from "@octokit/rest";
import { env, featureFlags } from "./env";

export interface GithubResult<T> {
  ok: boolean;
  data?: T;
  disabledReason?: string;
}

function getClient(): Octokit | null {
  if (!env.GITHUB_TOKEN) return null;
  return new Octokit({ auth: env.GITHUB_TOKEN });
}

export async function getRepoInfo(owner: string, repo: string): Promise<GithubResult<unknown>> {
  if (!featureFlags.githubEnabled) {
    return {
      ok: false,
      disabledReason:
        "GitHub integration is disabled because no GITHUB_TOKEN is configured. Add one to your .env file to enable repository linking.",
    };
  }
  const client = getClient();
  if (!client) {
    return { ok: false, disabledReason: "GitHub client could not be initialized." };
  }
  try {
    const { data } = await client.repos.get({ owner, repo });
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      disabledReason: err instanceof Error ? err.message : "Failed to reach GitHub.",
    };
  }
}

export async function listUserRepos(username: string): Promise<GithubResult<unknown[]>> {
  if (!featureFlags.githubEnabled) {
    return {
      ok: false,
      disabledReason:
        "GitHub integration is disabled because no GITHUB_TOKEN is configured.",
    };
  }
  const client = getClient();
  if (!client) return { ok: false, disabledReason: "GitHub client could not be initialized." };
  try {
    const { data } = await client.repos.listForUser({ username, per_page: 20 });
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      disabledReason: err instanceof Error ? err.message : "Failed to reach GitHub.",
    };
  }
}
