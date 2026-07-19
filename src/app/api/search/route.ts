import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionPayload } from "@/lib/session";
import { query, DatabaseUnavailableError } from "@/lib/db";

const searchSchema = z.object({
  q: z.string().min(1).max(100),
});

export async function GET(request: Request) {
  const session = await getSessionPayload();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");

    const parsed = searchSchema.safeParse({ q });
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid search query." }, { status: 400 });
    }

    const searchTerm = `%${parsed.data.q}%`;

    // Search projects for current user
    const projects = await query<{ id: string; title: string; type: string }>(
      `SELECT id, title, 'project' as type FROM "Project" 
       WHERE ("ownerId" = $1 OR $1 IN (
         SELECT "studentId" FROM "Enrollment" e 
         JOIN "Course" c ON c.id = e."courseId"
         WHERE c."lecturerId" = $1
       ))
       AND title ILIKE $2
       LIMIT 5`,
      [session.userId, searchTerm]
    );

    // Search courses
    const courses = await query<{ id: string; title: string; type: string }>(
      `SELECT id, title, 'course' as type FROM "Course"
       WHERE ("lecturerId" = $1 OR id IN (
         SELECT "courseId" FROM "Enrollment" WHERE "studentId" = $1
       ))
       AND title ILIKE $2
       LIMIT 5`,
      [session.userId, searchTerm]
    );

    // Search assignments
    const assignments = await query<{ id: string; title: string; type: string }>(
      `SELECT a.id, a.title, 'assignment' as type FROM "Assignment" a
       JOIN "Course" c ON c.id = a."courseId"
       WHERE (c."lecturerId" = $1 OR c.id IN (
         SELECT "courseId" FROM "Enrollment" WHERE "studentId" = $1
       ))
       AND a.title ILIKE $2
       LIMIT 5`,
      [session.userId, searchTerm]
    );

    const results = [...projects, ...courses, ...assignments].slice(0, 10);

    return NextResponse.json({ results });
  } catch (err) {
    if (err instanceof DatabaseUnavailableError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    console.error(err);
    return NextResponse.json({ error: "Search failed." }, { status: 500 });
  }
}
