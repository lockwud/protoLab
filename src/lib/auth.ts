import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { env } from "./env";
import type { SessionPayload } from "@/types";

const SALT_ROUNDS = 10;
export const SESSION_COOKIE = "protolab_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days, in seconds

const secretKey = () => new TextEncoder().encode(env.JWT_SECRET);

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secretKey());
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (typeof payload === "object" && payload && "userId" in payload) {
      return payload as unknown as SessionPayload;
    }
    return null;
  } catch {
    return null;
  }
}
