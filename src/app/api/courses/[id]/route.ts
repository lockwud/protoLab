import { NextResponse } from "next/server";
import { getSessionPayload } from "@/lib/session";
import { getCourse, listAssignmentsForCourse, listEnrollmentsForCourse } from "@/lib/data";
import { query, DatabaseUnavailableError } from "@/lib/db";
import { createId } from "@/lib/id";
import { z } from "zod";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionPayload();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  try {
    const course = await getCourse(id);
    if (!course) return NextResponse.json({ error: "Course not found." }, { status: 404 });
    if (session.role === "LECTURER" && course.lecturerId !== session.userId) {
      return NextResponse.json({ error: "You do not teach this course." }, { status: 403 });
    }
    if (session.role === "STUDENT") {
      const enrollment = await query<{ id: string }>(
        `SELECT id FROM "Enrollment" WHERE "courseId" = $1 AND "studentId" = $2`,
        [id, session.userId]
      );
      if (!enrollment[0]) return NextResponse.json({ error: "You are not enrolled in this course." }, { status: 403 });
    }
    const [assignments, enrollments] = await Promise.all([
      listAssignmentsForCourse(id),
      session.role === "STUDENT" ? Promise.resolve([]) : listEnrollmentsForCourse(id),
    ]);
    return NextResponse.json({ course, assignments, enrollments });
  } catch (err) {
    if (err instanceof DatabaseUnavailableError) return NextResponse.json({ error: err.message }, { status: 503 });
    console.error(err);
    return NextResponse.json({ error: "Failed to load course." }, { status: 500 });
  }
}

const enrollSchema = z.object({ studentEmail: z.string().email().optional() });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  // Self-enrollment for students, or lecturer enrolling a student by email.
  const session = await getSessionPayload();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const courseKey = decodeURIComponent(id).trim();

  const body = await request.json().catch(() => ({}));
  const parsed = enrollSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 400 });

  try {
    const course = await query<{ id: string; lecturerId: string }>(
      `SELECT id, "lecturerId" FROM "Course" WHERE id = $1 OR lower(code) = lower($1) LIMIT 1`,
      [courseKey]
    ).then((rows) => rows[0] ?? null);
    if (!course) return NextResponse.json({ error: "Course not found." }, { status: 404 });
    const courseId = course.id;

    let studentId = session.userId;
    if (parsed.data.studentEmail) {
      if (session.role === "STUDENT") {
        return NextResponse.json({ error: "Students can only enroll themselves." }, { status: 403 });
      }
      if (session.role === "LECTURER" && course.lecturerId !== session.userId) {
        return NextResponse.json({ error: "You do not teach this course." }, { status: 403 });
      }
      const rows = await query<{ id: string }>(`SELECT id FROM "User" WHERE email = $1`, [
        parsed.data.studentEmail,
      ]);
      if (!rows[0]) return NextResponse.json({ error: "No student found with that email." }, { status: 404 });
      studentId = rows[0].id;
    }

    const rows = await query(
      `INSERT INTO "Enrollment" (id, "studentId", "courseId")
       VALUES ($1, $2, $3)
       ON CONFLICT ("studentId", "courseId") DO NOTHING
       RETURNING *`,
      [createId("enr_"), studentId, courseId]
    );
    if (!rows[0]) {
      return NextResponse.json({ error: "Already enrolled in this course." }, { status: 409 });
    }
    return NextResponse.json({ enrollment: rows[0] }, { status: 201 });
  } catch (err) {
    if (err instanceof DatabaseUnavailableError) return NextResponse.json({ error: err.message }, { status: 503 });
    console.error(err);
    return NextResponse.json({ error: "Failed to enroll." }, { status: 500 });
  }
}
