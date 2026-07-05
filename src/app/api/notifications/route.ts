import { NextResponse } from "next/server";
import { getSessionPayload } from "@/lib/session";
import { listNotificationsForUser } from "@/lib/data";
import { DatabaseUnavailableError } from "@/lib/db";

export async function GET() {
  const session = await getSessionPayload();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const notifications = await listNotificationsForUser(session.userId);
    return NextResponse.json({ notifications });
  } catch (err) {
    if (err instanceof DatabaseUnavailableError) return NextResponse.json({ error: err.message }, { status: 503 });
    console.error(err);
    return NextResponse.json({ error: "Failed to load notifications." }, { status: 500 });
  }
}
