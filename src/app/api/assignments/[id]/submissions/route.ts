import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionPayload } from "@/lib/session";
import { query, DatabaseUnavailableError } from "@/lib/db";
import { createId } from "@/lib/id";
import { notify } from "@/lib/data";

const submitSchema = z.object({
  content: z.string().min(1),
  fileUrl: z.string().url().optional(),
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
    const rows = await query(
      `INSERT INTO "Submission" (id, "assignmentId", "studentId", content, "fileUrl", status, "submittedAt")
       VALUES ($1, $2, $3, $4, $5, 'SUBMITTED', now())
       ON CONFLICT ("assignmentId", "studentId")
       DO UPDATE SET content = $4, "fileUrl" = $5, status = 'SUBMITTED', "submittedAt" = now(), "updatedAt" = now()
       RETURNING *`,
      [createId("sub_"), assignmentId, session.userId, parsed.data.content, parsed.data.fileUrl ?? null]
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
