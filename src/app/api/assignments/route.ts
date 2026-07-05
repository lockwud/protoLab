import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionPayload } from "@/lib/session";
import { query, queryOne, DatabaseUnavailableError } from "@/lib/db";
import { createId } from "@/lib/id";
import { listAssignmentsForLecturer, listAssignmentsForStudent } from "@/lib/data";
import { notify } from "@/lib/data";

const createSchema = z.object({
  courseId: z.string(),
  title: z.string().min(2),
  description: z.string().min(2),
  dueDate: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
});

export async function GET() {
  const session = await getSessionPayload();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const assignments =
      session.role === "LECTURER" || session.role === "ADMIN"
        ? await listAssignmentsForLecturer(session.userId)
        : await listAssignmentsForStudent(session.userId);
    return NextResponse.json({ assignments });
  } catch (err) {
    if (err instanceof DatabaseUnavailableError) return NextResponse.json({ error: err.message }, { status: 503 });
    console.error(err);
    return NextResponse.json({ error: "Failed to load assignments." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSessionPayload();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "LECTURER" && session.role !== "ADMIN") {
    return NextResponse.json({ error: "Only lecturers can create assignments." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }

  try {
    const course = await queryOne<{ lecturerId: string }>(`SELECT "lecturerId" FROM "Course" WHERE id = $1`, [
      parsed.data.courseId,
    ]);
    if (!course) return NextResponse.json({ error: "Course not found." }, { status: 404 });
    if (course.lecturerId !== session.userId && session.role !== "ADMIN") {
      return NextResponse.json({ error: "You do not teach this course." }, { status: 403 });
    }

    const id = createId("asg_");
    const rows = await query(
      `INSERT INTO "Assignment" (id, "courseId", title, description, status, "dueDate")
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        id,
        parsed.data.courseId,
        parsed.data.title,
        parsed.data.description,
        parsed.data.status,
        parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
      ]
    );

    if (parsed.data.status === "PUBLISHED") {
      const students = await query<{ studentId: string }>(
        `SELECT "studentId" FROM "Enrollment" WHERE "courseId" = $1`,
        [parsed.data.courseId]
      );
      await Promise.all(
        students.map((s) =>
          notify(
            s.studentId,
            "New assignment published",
            `"${parsed.data.title}" was published.`,
            "ASSIGNMENT",
            `/assignments/${id}`
          )
        )
      );
    }

    return NextResponse.json({ assignment: rows[0] }, { status: 201 });
  } catch (err) {
    if (err instanceof DatabaseUnavailableError) return NextResponse.json({ error: err.message }, { status: 503 });
    console.error(err);
    return NextResponse.json({ error: "Failed to create assignment." }, { status: 500 });
  }
}
