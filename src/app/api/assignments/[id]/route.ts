import { NextResponse } from "next/server";
import { getSessionPayload } from "@/lib/session";
import { getAssignment, listSubmissionsForAssignment, getSubmissionForStudent } from "@/lib/data";
import { DatabaseUnavailableError } from "@/lib/db";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionPayload();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  try {
    const assignment = await getAssignment(id);
    if (!assignment) return NextResponse.json({ error: "Assignment not found." }, { status: 404 });

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
