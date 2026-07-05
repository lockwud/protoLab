import { NextResponse } from "next/server";
import { z } from "zod";
import { queryOne, DatabaseUnavailableError } from "@/lib/db";
import { verifyPassword, signSession, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/auth";
import type { User } from "@/types";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    );
  }
  const { email, password } = parsed.data;

  try {
    const user = await queryOne<User>(`SELECT * FROM "User" WHERE email = $1`, [email]);
    if (!user) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const token = await signSession({ userId: user.id, role: user.role, email: user.email, name: user.name });
    const { passwordHash: _unused, ...publicUser } = user;
    void _unused;
    const response = NextResponse.json({ user: publicUser });
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
    console.error("login error", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
