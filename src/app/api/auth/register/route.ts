import { NextResponse } from "next/server";
import { z } from "zod";
import { queryOne, DatabaseUnavailableError } from "@/lib/db";
import { hashPassword, signSession, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/auth";
import { createId } from "@/lib/id";
import type { PublicUser, Role } from "@/types";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["STUDENT", "LECTURER"]),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    );
  }
  const { name, email, password, role } = parsed.data;

  try {
    const existing = await queryOne(`SELECT id FROM "User" WHERE email = $1`, [email]);
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const id = createId("usr_");
    const user = await queryOne<PublicUser & { role: Role }>(
      `INSERT INTO "User" (id, name, email, "passwordHash", role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, role, "avatarUrl", bio, "githubUsername", "createdAt", "updatedAt"`,
      [id, name, email, passwordHash, role]
    );
    if (!user) throw new Error("Failed to create user.");

    const token = await signSession({ userId: user.id, role: user.role, email: user.email, name: user.name });
    const response = NextResponse.json({ user });
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });
    return response;
  } catch (err) {
    if (err instanceof DatabaseUnavailableError) {
      return NextResponse.json(
        { error: "Database is unavailable. Please check your Postgres connection and try again." },
        { status: 503 }
      );
    }
    console.error("register error", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
