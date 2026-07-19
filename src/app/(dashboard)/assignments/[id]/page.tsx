import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { getAssignment, getCourse, getSubmissionForStudent, listCoursesForStudent, listProjectsForOwner, listSubmissionsForAssignment } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SubmissionForm } from "./submission-form";
import { GradeForm } from "./grade-form";

export default async function AssignmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return null;

  const assignment = await getAssignment(id);
  if (!assignment) notFound();
  if (user.role === "STUDENT") {
    const courses = await listCoursesForStudent(user.id);
    if (!courses.some((course) => course.id === assignment.courseId)) notFound();
  }
  if (user.role === "LECTURER") {
    const course = await getCourse(assignment.courseId);
    if (!course || course.lecturerId !== user.id) notFound();
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Badge variant="outline">{assignment.status}</Badge>
      <h1 className="font-display mt-2 text-3xl font-semibold">{assignment.title}</h1>
      {assignment.dueDate && (
        <p className="mt-1 text-sm text-muted-foreground">Due {new Date(assignment.dueDate).toLocaleDateString()}</p>
      )}
      <p className="mt-4 whitespace-pre-wrap text-muted-foreground">{assignment.description}</p>

      <div className="mt-8">
        {user.role === "STUDENT" ? (
          <StudentSubmissionSection assignmentId={id} studentId={user.id} />
        ) : (
          <LecturerSubmissionsSection assignmentId={id} />
        )}
      </div>
    </div>
  );
}

async function StudentSubmissionSection({ assignmentId, studentId }: { assignmentId: string; studentId: string }) {
  const [submission, projects] = await Promise.all([
    getSubmissionForStudent(assignmentId, studentId),
    listProjectsForOwner(studentId),
  ]);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Your submission</CardTitle>
      </CardHeader>
      <CardContent>
        <SubmissionForm assignmentId={assignmentId} existing={submission} projects={projects} />
      </CardContent>
    </Card>
  );
}

async function LecturerSubmissionsSection({ assignmentId }: { assignmentId: string }) {
  const submissions = await listSubmissionsForAssignment(assignmentId);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Submissions ({submissions.length})</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {submissions.length === 0 && <p className="text-sm text-muted-foreground">No submissions yet.</p>}
        {submissions.map((s) => (
          <div key={s.id} className="rounded-md border border-border p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{s.studentName}</div>
                <div className="text-xs text-muted-foreground">{s.studentEmail}</div>
              </div>
              <Badge>{s.grade !== null ? `${s.grade}/100` : s.status}</Badge>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm">{s.content}</p>
            {s.fileUrl && (
              <a href={s.fileUrl} className="mt-1 block text-sm text-primary underline" target="_blank" rel="noreferrer">
                Attached file
              </a>
            )}
            {s.projectId && (
              <Link href={`/projects/${s.projectId}`} className="mt-3 inline-flex rounded-md bg-foreground px-3 py-2 text-xs font-medium text-background hover:bg-foreground/90">
                Test submitted prototype
              </Link>
            )}
            <div className="mt-3">
              <GradeForm submissionId={s.id} />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
