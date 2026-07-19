import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionPayload } from "@/lib/session";
import { getProject, listMilestonesForProject, listFeedbackForProject } from "@/lib/data";
import { query, queryOne, DatabaseUnavailableError } from "@/lib/db";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionPayload();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  try {
    const project = await getProject(id);
    if (!project) return NextResponse.json({ error: "Prototype not found." }, { status: 404 });
    if (session.role === "STUDENT" && project.ownerId !== session.userId) {
      return NextResponse.json({ error: "Prototype not found." }, { status: 404 });
    }
    const [milestones, feedback] = await Promise.all([
      listMilestonesForProject(id),
      listFeedbackForProject(id),
    ]);
    return NextResponse.json({ project, milestones, feedback });
  } catch (err) {
    if (err instanceof DatabaseUnavailableError) return NextResponse.json({ error: err.message }, { status: 503 });
    console.error(err);
    return NextResponse.json({ error: "Failed to load prototype." }, { status: 500 });
  }
}

const patchSchema = z.object({
  title: z.string().min(2).optional(),
  summary: z.string().min(2).optional(),
  status: z.string().optional(),
  githubRepoUrl: z.string().url().optional().or(z.literal("")),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionPayload();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 400 });

  try {
    const project = await queryOne<{ ownerId: string }>(`SELECT "ownerId" FROM "Project" WHERE id = $1`, [id]);
    if (!project) return NextResponse.json({ error: "Prototype not found." }, { status: 404 });
    if (project.ownerId !== session.userId && session.role === "STUDENT") {
      return NextResponse.json({ error: "You do not own this prototype." }, { status: 403 });
    }

    const fields = parsed.data;
    const sets: string[] = [];
    const values: unknown[] = [];
    let i = 1;
    for (const [key, value] of Object.entries(fields)) {
      if (value === undefined) continue;
      sets.push(`"${key}" = $${i}`);
      values.push(value === "" ? null : value);
      i++;
    }
    if (sets.length === 0) return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
    values.push(id);

    const rows = await query(
      `UPDATE "Project" SET ${sets.join(", ")}, "updatedAt" = now() WHERE id = $${i} RETURNING *`,
      values
    );
    return NextResponse.json({ project: rows[0] });
  } catch (err) {
    if (err instanceof DatabaseUnavailableError) return NextResponse.json({ error: err.message }, { status: 503 });
    console.error(err);
    return NextResponse.json({ error: "Failed to update prototype." }, { status: 500 });
  }
}
