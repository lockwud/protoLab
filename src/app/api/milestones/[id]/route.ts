import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionPayload } from "@/lib/session";
import { query, queryOne, DatabaseUnavailableError } from "@/lib/db";

const patchSchema = z.object({
  status: z.enum(["PENDING", "IN_PROGRESS", "DONE", "BLOCKED"]).optional(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  dueDate: z.string().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionPayload();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 400 });

  try {
    const milestone = await queryOne<{ ownerId: string; projectId: string }>(
      `SELECT "ownerId", "projectId" FROM "Milestone" WHERE id = $1`,
      [id]
    );
    if (!milestone) return NextResponse.json({ error: "Milestone not found." }, { status: 404 });

    const sets: string[] = [];
    const values: unknown[] = [];
    let i = 1;
    for (const [key, value] of Object.entries(parsed.data)) {
      if (value === undefined) continue;
      sets.push(`"${key}" = $${i}`);
      values.push(key === "dueDate" ? new Date(value as string) : value);
      i++;
    }
    if (sets.length === 0) return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
    values.push(id);

    const rows = await query(
      `UPDATE "Milestone" SET ${sets.join(", ")}, "updatedAt" = now() WHERE id = $${i} RETURNING *`,
      values
    );
    return NextResponse.json({ milestone: rows[0] });
  } catch (err) {
    if (err instanceof DatabaseUnavailableError) return NextResponse.json({ error: err.message }, { status: 503 });
    console.error(err);
    return NextResponse.json({ error: "Failed to update milestone." }, { status: 500 });
  }
}
