import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionPayload } from "@/lib/session";
import { query, queryOne, DatabaseUnavailableError } from "@/lib/db";
import { createId } from "@/lib/id";

export async function GET() {
  try {
    const rows = await query(
      `SELECT r.*, p.title, p.summary, u.name as "authorName"
       FROM "InnovationRepository" r
       JOIN "Project" p ON p.id = r."projectId"
       JOIN "User" u ON u.id = r."authorId"
       ORDER BY r."publishedAt" DESC`
    );
    return NextResponse.json({ entries: rows });
  } catch (err) {
    if (err instanceof DatabaseUnavailableError) return NextResponse.json({ error: err.message }, { status: 503 });
    console.error(err);
    return NextResponse.json({ error: "Failed to load the innovation repository." }, { status: 500 });
  }
}

const publishSchema = z.object({
  projectId: z.string(),
  tags: z.array(z.string()).default([]),
});

export async function POST(request: Request) {
  const session = await getSessionPayload();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = publishSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 400 });

  try {
    const project = await queryOne<{ ownerId: string }>(`SELECT "ownerId" FROM "Project" WHERE id = $1`, [
      parsed.data.projectId,
    ]);
    if (!project) return NextResponse.json({ error: "Prototype not found." }, { status: 404 });
    if (project.ownerId !== session.userId && session.role === "STUDENT") {
      return NextResponse.json({ error: "You do not own this prototype." }, { status: 403 });
    }

    const rows = await query(
      `INSERT INTO "InnovationRepository" (id, "projectId", "authorId", tags)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT ("projectId") DO UPDATE SET tags = $4
       RETURNING *`,
      [createId("rep_"), parsed.data.projectId, project.ownerId, parsed.data.tags]
    );
    return NextResponse.json({ entry: rows[0] }, { status: 201 });
  } catch (err) {
    if (err instanceof DatabaseUnavailableError) return NextResponse.json({ error: err.message }, { status: 503 });
    console.error(err);
    return NextResponse.json({ error: "Failed to publish to the repository." }, { status: 500 });
  }
}
