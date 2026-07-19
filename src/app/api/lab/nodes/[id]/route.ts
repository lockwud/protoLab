import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionPayload } from "@/lib/session";
import { query, DatabaseUnavailableError } from "@/lib/db";
import { canAccessLabNode } from "@/lib/lab-access";

const patchSchema = z.object({
  x: z.number().optional(),
  y: z.number().optional(),
  label: z.string().min(1).optional(),
  config: z.record(z.string(), z.unknown()).optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionPayload();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid node update." }, { status: 400 });

  try {
    const node = await canAccessLabNode(id, session.userId, session.role);
    if (!node) return NextResponse.json({ error: "Node not found." }, { status: 404 });

    const rows = await query(
      `UPDATE "LabNode"
       SET x = COALESCE($2, x),
           y = COALESCE($3, y),
           label = COALESCE($4, label),
           config = COALESCE($5, config),
           "updatedAt" = now()
       WHERE id = $1
       RETURNING *`,
      [
        id,
        parsed.data.x ?? null,
        parsed.data.y ?? null,
        parsed.data.label ?? null,
        parsed.data.config ? JSON.stringify(parsed.data.config) : null,
      ]
    );
    if (!rows[0]) return NextResponse.json({ error: "Node not found." }, { status: 404 });
    return NextResponse.json({ node: rows[0] });
  } catch (err) {
    if (err instanceof DatabaseUnavailableError) return NextResponse.json({ error: err.message }, { status: 503 });
    console.error(err);
    return NextResponse.json({ error: "Failed to update node." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionPayload();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  try {
    const node = await canAccessLabNode(id, session.userId, session.role);
    if (!node) return NextResponse.json({ error: "Node not found." }, { status: 404 });

    await query(`DELETE FROM "LabNode" WHERE id = $1`, [id]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof DatabaseUnavailableError) return NextResponse.json({ error: err.message }, { status: 503 });
    console.error(err);
    return NextResponse.json({ error: "Failed to delete node." }, { status: 500 });
  }
}
