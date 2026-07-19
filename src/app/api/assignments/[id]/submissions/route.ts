import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionPayload } from "@/lib/session";
import { query, DatabaseUnavailableError } from "@/lib/db";
import { createId } from "@/lib/id";
import { notify } from "@/lib/data";

const submitSchema = z.object({
  content: z.string().min(1),
  fileUrl: z.string().url().optional(),
  projectId: z.string().optional(),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionPayload();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "STUDENT") {
    return NextResponse.json({ error: "Only students can submit assignments." }, { status: 403 });
  }
  const { id: assignmentId } = await params;

  const body = await request.json().catch(() => null);
  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }

  try {
    const assignment = await query<{ id: string; status: string }>(
      `SELECT a.id, a.status
       FROM "Assignment" a
       JOIN "Enrollment" e ON e."courseId" = a."courseId"
       WHERE a.id = $1 AND e."studentId" = $2`,
      [assignmentId, session.userId]
    );
    if (!assignment[0]) return NextResponse.json({ error: "Assignment not found for your enrolled courses." }, { status: 404 });
    if (assignment[0].status !== "PUBLISHED") return NextResponse.json({ error: "This assignment is not open for submission." }, { status: 403 });
    if (parsed.data.projectId) {
      const project = await query<{ id: string }>(`SELECT id FROM "Project" WHERE id = $1 AND "ownerId" = $2`, [
        parsed.data.projectId,
        session.userId,
      ]);
      if (!project[0]) return NextResponse.json({ error: "Selected prototype was not found for your account." }, { status: 404 });
    }

    const rows = await query(
      `INSERT INTO "Submission" (id, "assignmentId", "studentId", "projectId", content, "fileUrl", status, "submittedAt")
       VALUES ($1, $2, $3, $4, $5, $6, 'SUBMITTED', now())
       ON CONFLICT ("assignmentId", "studentId")
       DO UPDATE SET "projectId" = $4, content = $5, "fileUrl" = $6, status = 'SUBMITTED', "submittedAt" = now(), "updatedAt" = now()
       RETURNING *`,
      [createId("sub_"), assignmentId, session.userId, parsed.data.projectId ?? null, parsed.data.content, parsed.data.fileUrl ?? null]
    );

    const course = await query<{ lecturerId: string; title: string }>(
      `SELECT c."lecturerId", a.title FROM "Assignment" a JOIN "Course" c ON c.id = a."courseId" WHERE a.id = $1`,
      [assignmentId]
    );
    if (course[0]) {
      await notify(
        course[0].lecturerId,
        "New submission",
        `${session.name} submitted "${course[0].title}".`,
        "ASSIGNMENT",
        `/assignments/${assignmentId}`
      );
    }

    return NextResponse.json({ submission: rows[0] }, { status: 201 });
  } catch (err) {
    if (err instanceof DatabaseUnavailableError) return NextResponse.json({ error: err.message }, { status: 503 });
    console.error(err);
    return NextResponse.json({ error: "Failed to submit assignment." }, { status: 500 });
  }
}
