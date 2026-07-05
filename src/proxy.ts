import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";

const SESSION_COOKIE = "protolab_session";

const PUBLIC_PATHS = ["/login", "/register"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Let API auth routes, static assets, and public marketing/auth pages through.
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    PUBLIC_PATHS.includes(pathname)
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;

  const isProtectedPage = pathname.startsWith("/dashboard") ||
    pathname.startsWith("/courses") ||
    pathname.startsWith("/assignments") ||
    pathname.startsWith("/projects") ||
    pathname.startsWith("/repository") ||
    pathname.startsWith("/analytics") ||
    pathname.startsWith("/notifications") ||
    pathname.startsWith("/settings");

  if (isProtectedPage && !session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Role-based routing: keep students and lecturers on their own dashboard root.
  if (session && pathname === "/dashboard") {
    const target = session.role === "LECTURER" ? "/dashboard/lecturer" : "/dashboard/student";
    return NextResponse.redirect(new URL(target, request.url));
  }
  if (session && pathname.startsWith("/dashboard/lecturer") && session.role !== "LECTURER" && session.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard/student", request.url));
  }
  if (session && pathname.startsWith("/dashboard/student") && session.role !== "STUDENT" && session.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard/lecturer", request.url));
  }

  if (session && (pathname === "/login" || pathname === "/register")) {
    const target = session.role === "LECTURER" ? "/dashboard/lecturer" : "/dashboard/student";
    return NextResponse.redirect(new URL(target, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.png$|.*\\.svg$).*)"],
};
