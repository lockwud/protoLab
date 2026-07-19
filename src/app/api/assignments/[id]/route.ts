import { NextResponse } from "next/server";
import { getSessionPayload } from "@/lib/session";
import { getAssignment, listSubmissionsForAssignment, getSubmissionForStudent } from "@/lib/data";
import { queryOne, DatabaseUnavailableError } from "@/lib/db";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionPayload();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  try {
    const assignment = await getAssignment(id);
    if (!assignment) return NextResponse.json({ error: "Assignment not found." }, { status: 404 });

    if (session.role === "STUDENT") {
      const enrollment = await queryOne<{ id: string }>(
        `SELECT e.id
         FROM "Enrollment" e
         WHERE e."courseId" = $1 AND e."studentId" = $2`,
        [assignment.courseId, session.userId]
      );
      if (!enrollment) return NextResponse.json({ error: "Assignment not found." }, { status: 404 });
    } else if (session.role === "LECTURER") {
      const course = await queryOne<{ lecturerId: string }>(`SELECT "lecturerId" FROM "Course" WHERE id = $1`, [assignment.courseId]);
      if (!course || course.lecturerId !== session.userId) return NextResponse.json({ error: "Assignment not found." }, { status: 404 });
    }

    if (session.role === "STUDENT") {
      const submission = await getSubmissionForStudent(id, session.userId);
      return NextResponse.json({ assignment, submission });
    }

    const submissions = await listSubmissionsForAssignment(id);
    return NextResponse.json({ assignment, submissions });
  } catch (err) {
    if (err instanceof DatabaseUnavailableError) return NextResponse.json({ error: err.message }, { status: 503 });
    console.error(err);
    return NextResponse.json({ error: "Failed to load assignment." }, { status: 500 });
  }
}
