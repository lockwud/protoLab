import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionPayload } from "@/lib/session";
import { query, queryOne, DatabaseUnavailableError } from "@/lib/db";
import { createId } from "@/lib/id";
import { notify } from "@/lib/data";

const createSchema = z.object({
  projectId: z.string().optional(),
  submissionId: z.string().optional(),
  content: z.string().min(1),
  rating: z.number().min(1).max(5).optional(),
  grade: z.number().min(0).max(100).optional(),
});

export async function POST(request: Request) {
  const session = await getSessionPayload();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "LECTURER" && session.role !== "ADMIN") {
    return NextResponse.json({ error: "Only lecturers can leave review feedback." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }
  if (!parsed.data.projectId && !parsed.data.submissionId) {
    return NextResponse.json({ error: "Feedback must target a project or a submission." }, { status: 400 });
  }

  try {
    const id = createId("fbk_");
    const rows = await query(
      `INSERT INTO "Feedback" (id, "projectId", "submissionId", "authorId", content, rating)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        id,
        parsed.data.projectId ?? null,
        parsed.data.submissionId ?? null,
        session.userId,
        parsed.data.content,
        parsed.data.rating ?? null,
      ]
    );

    if (parsed.data.grade !== undefined && parsed.data.submissionId) {
      await query(`UPDATE "Submission" SET grade = $1, status = 'APPROVED', "updatedAt" = now() WHERE id = $2`, [
        parsed.data.grade,
        parsed.data.submissionId,
      ]);
    }

    if (parsed.data.projectId) {
      const owner = await queryOne<{ ownerId: string; title: string }>(
        `SELECT "ownerId", title FROM "Project" WHERE id = $1`,
        [parsed.data.projectId]
      );
      if (owner) {
        await notify(owner.ownerId, "New feedback", `You received feedback on "${owner.title}".`, "FEEDBACK", `/projects/${parsed.data.projectId}`);
      }
    }
    if (parsed.data.submissionId) {
      const sub = await queryOne<{ studentId: string }>(`SELECT "studentId" FROM "Submission" WHERE id = $1`, [
        parsed.data.submissionId,
      ]);
      if (sub) {
        await notify(sub.studentId, "Submission reviewed", "Your submission has feedback and a grade.", "FEEDBACK");
      }
    }

    return NextResponse.json({ feedback: rows[0] }, { status: 201 });
  } catch (err) {
    if (err instanceof DatabaseUnavailableError) return NextResponse.json({ error: err.message }, { status: 503 });
    console.error(err);
    return NextResponse.json({ error: "Failed to submit feedback." }, { status: 500 });
  }
}
