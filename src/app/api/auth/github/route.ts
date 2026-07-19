import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { GITHUB_OAUTH_NEXT_COOKIE, GITHUB_OAUTH_STATE_COOKIE } from "@/lib/github-oauth";

export async function GET(request: Request) {
  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
    return NextResponse.redirect(new URL("/login?error=github_not_configured", request.url));
  }

  const { searchParams } = new URL(request.url);
  const next = safeNext(searchParams.get("next"));
  const state = crypto.randomUUID();
  const callbackUrl = new URL("/api/auth/github/callback", env.NEXT_PUBLIC_APP_URL);
  const authorizeUrl = new URL("https://github.com/login/oauth/authorize");
  authorizeUrl.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
  authorizeUrl.searchParams.set("redirect_uri", callbackUrl.toString());
  authorizeUrl.searchParams.set("scope", "read:user user:email");
  authorizeUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set(GITHUB_OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 10,
    path: "/",
  });
  response.cookies.set(GITHUB_OAUTH_NEXT_COOKIE, next, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 10,
    path: "/",
  });
  return response;
}

function safeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/dashboard/student";
  return value;
}
