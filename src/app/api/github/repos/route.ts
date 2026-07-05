import { NextResponse } from "next/server";
import { getSessionPayload } from "@/lib/session";
import { listUserRepos } from "@/lib/github";

export async function GET(request: Request) {
  const session = await getSessionPayload();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");
  if (!username) return NextResponse.json({ error: "Missing username query param." }, { status: 400 });

  const result = await listUserRepos(username);
  if (!result.ok) return NextResponse.json({ error: result.disabledReason }, { status: 503 });
  return NextResponse.json({ repos: result.data });
}
