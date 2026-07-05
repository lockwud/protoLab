import "server-only";
import { cookies } from "next/headers";
import { verifySession, SESSION_COOKIE } from "./auth";
import { queryOne } from "./db";
import type { PublicUser, SessionPayload } from "@/types";

export async function getSessionPayload(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function getCurrentUser(): Promise<PublicUser | null> {
  const session = await getSessionPayload();
  if (!session) return null;
  const user = await queryOne<PublicUser>(
    `SELECT id, name, email, role, "avatarUrl", bio, "githubUsername", "createdAt", "updatedAt"
     FROM "User" WHERE id = $1`,
    [session.userId]
  );
  return user;
}
