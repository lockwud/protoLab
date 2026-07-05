import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionPayload } from "@/lib/session";
import { query, DatabaseUnavailableError } from "@/lib/db";
import { createId } from "@/lib/id";
import { listAllProjects, listProjectsForOwner } from "@/lib/data";

const createSchema = z.object({
  title: z.string().min(2),
  summary: z.string().min(2),
  problemStatement: z.string().optional(),
  assignmentId: z.string().optional(),
});

export async function GET() {
  const session = await getSessionPayload();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const projects =
      session.role === "STUDENT" ? await listProjectsForOwner(session.userId) : await listAllProjects();
    return NextResponse.json({ projects });
  } catch (err) {
    if (err instanceof DatabaseUnavailableError) return NextResponse.json({ error: err.message }, { status: 503 });
    console.error(err);
    return NextResponse.json({ error: "Failed to load prototypes." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSessionPayload();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }

  try {
    const id = createId("prj_");
    const rows = await query(
      `INSERT INTO "Project" (id, title, summary, "problemStatement", "ownerId", "assignmentId")
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        id,
        parsed.data.title,
        parsed.data.summary,
        parsed.data.problemStatement ?? null,
        session.userId,
        parsed.data.assignmentId ?? null,
      ]
    );

    // Seed a default milestone roadmap (module: prototype planning engine).
    const defaults = [
      "Define problem & scope",
      "Design architecture",
      "Build core prototype",
      "Test & iterate",
      "Present & document",
    ];
    await Promise.all(
      defaults.map((title, i) =>
        query(
          `INSERT INTO "Milestone" (id, "projectId", title, "ownerId", "order") VALUES ($1, $2, $3, $4, $5)`,
          [createId("mls_"), id, title, session.userId, i]
        )
      )
    );

    return NextResponse.json({ project: rows[0] }, { status: 201 });
  } catch (err) {
    if (err instanceof DatabaseUnavailableError) return NextResponse.json({ error: err.message }, { status: 503 });
    console.error(err);
    return NextResponse.json({ error: "Failed to create prototype." }, { status: 500 });
  }
}
