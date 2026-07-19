import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/lib/env";
import { hashPassword, signSession, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/auth";
import { queryOne, DatabaseUnavailableError } from "@/lib/db";
import { createId } from "@/lib/id";
import type { PublicUser, Role } from "@/types";
import { GITHUB_OAUTH_NEXT_COOKIE, GITHUB_OAUTH_STATE_COOKIE } from "@/lib/github-oauth";

const tokenSchema = z.object({ access_token: z.string() });

type GithubUser = {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
};

type GithubEmail = {
  email: string;
  primary: boolean;
  verified: boolean;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const stateCookie = request.headers.get("cookie")?.match(new RegExp(`${GITHUB_OAUTH_STATE_COOKIE}=([^;]+)`))?.[1];
  const nextCookie = request.headers.get("cookie")?.match(new RegExp(`${GITHUB_OAUTH_NEXT_COOKIE}=([^;]+)`))?.[1];
  const next = safeNext(nextCookie ? decodeURIComponent(nextCookie) : null);

  if (error) return redirectWithError(request, error);
  if (!code || !state || !stateCookie || state !== stateCookie) return redirectWithError(request, "invalid_state");
  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) return redirectWithError(request, "github_not_configured");

  try {
    const accessToken = await exchangeCode(code);
    const githubUser = await fetchGithubUser(accessToken);
    const email = await resolveGithubEmail(accessToken, githubUser);
    if (!email) return redirectWithError(request, "github_email_unavailable");

    const user = await upsertGithubUser(githubUser, email);
    const token = await signSession({ userId: user.id, role: user.role, email: user.email, name: user.name });
    const destination = user.role === "LECTURER" && next === "/dashboard/student" ? "/dashboard/lecturer" : next;
    const response = NextResponse.redirect(new URL(destination, request.url));
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });
    response.cookies.delete(GITHUB_OAUTH_STATE_COOKIE);
    response.cookies.delete(GITHUB_OAUTH_NEXT_COOKIE);
    return response;
  } catch (err) {
    if (err instanceof DatabaseUnavailableError) return redirectWithError(request, "database_unavailable");
    console.error("github oauth error", err);
    return redirectWithError(request, "github_oauth_failed");
  }
}

async function exchangeCode(code: string) {
  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: new URL("/api/auth/github/callback", env.NEXT_PUBLIC_APP_URL).toString(),
    }),
  });
  if (!res.ok) throw new Error(`GitHub token exchange failed: ${res.status}`);
  const parsed = tokenSchema.safeParse(await res.json());
  if (!parsed.success) throw new Error("GitHub token response did not include access_token.");
  return parsed.data.access_token;
}

async function fetchGithubUser(accessToken: string) {
  const res = await fetch("https://api.github.com/user", {
    headers: { authorization: `Bearer ${accessToken}`, accept: "application/vnd.github+json" },
  });
  if (!res.ok) throw new Error(`GitHub user lookup failed: ${res.status}`);
  return (await res.json()) as GithubUser;
}

async function resolveGithubEmail(accessToken: string, user: GithubUser) {
  if (user.email) return user.email.toLowerCase();
  const res = await fetch("https://api.github.com/user/emails", {
    headers: { authorization: `Bearer ${accessToken}`, accept: "application/vnd.github+json" },
  });
  if (!res.ok) throw new Error(`GitHub email lookup failed: ${res.status}`);
  const emails = (await res.json()) as GithubEmail[];
  return emails.find((item) => item.primary && item.verified)?.email.toLowerCase() ?? emails.find((item) => item.verified)?.email.toLowerCase() ?? null;
}

async function upsertGithubUser(githubUser: GithubUser, email: string) {
  const existing = await queryOne<PublicUser & { role: Role }>(
    `UPDATE "User"
     SET "githubUsername" = $2,
         "avatarUrl" = COALESCE("avatarUrl", $3),
         "updatedAt" = now()
     WHERE email = $1
     RETURNING id, name, email, role, "avatarUrl", bio, "githubUsername", "createdAt", "updatedAt"`,
    [email, githubUser.login, githubUser.avatar_url]
  );
  if (existing) return existing;

  const id = createId("usr_");
  const passwordHash = await hashPassword(createId("oauth_"));
  const user = await queryOne<PublicUser & { role: Role }>(
    `INSERT INTO "User" (id, name, email, "passwordHash", role, "avatarUrl", "githubUsername")
     VALUES ($1, $2, $3, $4, 'STUDENT', $5, $6)
     RETURNING id, name, email, role, "avatarUrl", bio, "githubUsername", "createdAt", "updatedAt"`,
    [id, githubUser.name ?? githubUser.login, email, passwordHash, githubUser.avatar_url, githubUser.login]
  );
  if (!user) throw new Error("Failed to create GitHub user.");
  return user;
}

function redirectWithError(request: Request, error: string) {
  const url = new URL("/login", request.url);
  url.searchParams.set("error", error);
  const response = NextResponse.redirect(url);
  response.cookies.delete(GITHUB_OAUTH_STATE_COOKIE);
  response.cookies.delete(GITHUB_OAUTH_NEXT_COOKIE);
  return response;
}

function safeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/dashboard/student";
  return value;
}
