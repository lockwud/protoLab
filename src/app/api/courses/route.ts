import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionPayload } from "@/lib/session";
import { query, DatabaseUnavailableError } from "@/lib/db";
import { createId } from "@/lib/id";
import { listAllCourses, listCoursesForLecturer, listCoursesForStudent } from "@/lib/data";

const createCourseSchema = z.object({
  title: z.string().min(2),
  code: z.string().min(2),
  description: z.string().optional(),
});

export async function GET() {
  const session = await getSessionPayload();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const courses =
      session.role === "LECTURER"
        ? await listCoursesForLecturer(session.userId)
        : session.role === "ADMIN"
        ? await listAllCourses()
        : await listCoursesForStudent(session.userId);
    return NextResponse.json({ courses });
  } catch (err) {
    if (err instanceof DatabaseUnavailableError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    console.error(err);
    return NextResponse.json({ error: "Failed to load courses." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSessionPayload();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "LECTURER" && session.role !== "ADMIN") {
    return NextResponse.json({ error: "Only lecturers can create courses." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createCourseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }

  try {
    const id = createId("crs_");
    const rows = await query(
      `INSERT INTO "Course" (id, title, code, description, "lecturerId")
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [id, parsed.data.title, parsed.data.code, parsed.data.description ?? null, session.userId]
    );
    return NextResponse.json({ course: rows[0] }, { status: 201 });
  } catch (err) {
    if (err instanceof DatabaseUnavailableError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    const message = err instanceof Error ? err.message : "Failed to create course.";
    if (/duplicate key/i.test(message)) {
      return NextResponse.json({ error: "A course with this code already exists." }, { status: 409 });
    }
    console.error(err);
    return NextResponse.json({ error: "Failed to create course." }, { status: 500 });
  }
}
