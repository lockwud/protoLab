import { NextResponse } from "next/server";
import { getSessionPayload } from "@/lib/session";
import { query, DatabaseUnavailableError } from "@/lib/db";

export async function PATCH(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionPayload();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    const rows = await query(
      `UPDATE "Notification" SET read = true WHERE id = $1 AND "userId" = $2 RETURNING *`,
      [id, session.userId]
    );
    if (!rows[0]) return NextResponse.json({ error: "Notification not found." }, { status: 404 });
    return NextResponse.json({ notification: rows[0] });
  } catch (err) {
    if (err instanceof DatabaseUnavailableError) return NextResponse.json({ error: err.message }, { status: 503 });
    console.error(err);
    return NextResponse.json({ error: "Failed to update notification." }, { status: 500 });
  }
}
