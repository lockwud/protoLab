import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionPayload } from "@/lib/session";
import { query, queryOne, DatabaseUnavailableError } from "@/lib/db";
import { createId } from "@/lib/id";

const createSchema = z.object({
  projectId: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  order: z.number().default(0),
});

export async function POST(request: Request) {
  const session = await getSessionPayload();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }

  try {
    const project = await queryOne<{ ownerId: string }>(`SELECT "ownerId" FROM "Project" WHERE id = $1`, [parsed.data.projectId]);
    if (!project) return NextResponse.json({ error: "Prototype not found." }, { status: 404 });
    if (session.role === "STUDENT" && project.ownerId !== session.userId) {
      return NextResponse.json({ error: "You do not own this prototype." }, { status: 403 });
    }

    const id = createId("mls_");
    const rows = await query(
      `INSERT INTO "Milestone" (id, "projectId", title, description, "ownerId", "dueDate", "order")
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        id,
        parsed.data.projectId,
        parsed.data.title,
        parsed.data.description ?? null,
        session.userId,
        parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
        parsed.data.order,
      ]
    );
    return NextResponse.json({ milestone: rows[0] }, { status: 201 });
  } catch (err) {
    if (err instanceof DatabaseUnavailableError) return NextResponse.json({ error: err.message }, { status: 503 });
    console.error(err);
    return NextResponse.json({ error: "Failed to create milestone." }, { status: 500 });
  }
}
