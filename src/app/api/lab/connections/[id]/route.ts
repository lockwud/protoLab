import { NextResponse } from "next/server";
import { getSessionPayload } from "@/lib/session";
import { query, DatabaseUnavailableError } from "@/lib/db";
import { canAccessLabConnection } from "@/lib/lab-access";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionPayload();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  try {
    const connection = await canAccessLabConnection(id, session.userId, session.role);
    if (!connection) return NextResponse.json({ error: "Connection not found." }, { status: 404 });

    await query(`DELETE FROM "LabConnection" WHERE id = $1`, [id]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof DatabaseUnavailableError) return NextResponse.json({ error: err.message }, { status: 503 });
    console.error(err);
    return NextResponse.json({ error: "Failed to delete connection." }, { status: 500 });
  }
}
