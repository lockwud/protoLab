import { NextResponse } from "next/server";
import { getSessionPayload } from "@/lib/session";
import { query, DatabaseUnavailableError } from "@/lib/db";

export async function GET() {
  const session = await getSessionPayload();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role === "STUDENT") {
    return NextResponse.json({ error: "Analytics is available to lecturers only." }, { status: 403 });
  }

  try {
    const [byStatus, submissionRate, milestoneProgress, activeStudents] = await Promise.all([
      query<{ status: string; count: string }>(
        `SELECT status, count(*) FROM "Project" GROUP BY status`
      ),
      query<{ status: string; count: string }>(
        `SELECT status, count(*) FROM "Submission" GROUP BY status`
      ),
      query<{ status: string; count: string }>(
        `SELECT status, count(*) FROM "Milestone" GROUP BY status`
      ),
      query<{ count: string }>(
        `SELECT count(DISTINCT "studentId") FROM "Enrollment" WHERE status = 'ACTIVE'`
      ),
    ]);

    return NextResponse.json({
      projectsByStatus: byStatus,
      submissionsByStatus: submissionRate,
      milestonesByStatus: milestoneProgress,
      activeStudents: Number(activeStudents[0]?.count ?? 0),
    });
  } catch (err) {
    if (err instanceof DatabaseUnavailableError) return NextResponse.json({ error: err.message }, { status: 503 });
    console.error(err);
    return NextResponse.json({ error: "Failed to load analytics." }, { status: 500 });
  }
}
