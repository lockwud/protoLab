import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { getCourse, listAssignmentsForCourse, listCoursesForStudent, listEnrollmentsForCourse } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreateAssignmentForm } from "./create-assignment-form";

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return null;

  const course = await getCourse(id);
  if (!course) notFound();
  if (user.role === "LECTURER" && course.lecturerId !== user.id) notFound();
  if (user.role === "STUDENT") {
    const courses = await listCoursesForStudent(user.id);
    if (!courses.some((item) => item.id === id)) notFound();
  }

  const [assignments, enrollments] = await Promise.all([
    listAssignmentsForCourse(id),
    user.role !== "STUDENT" ? listEnrollmentsForCourse(id) : Promise.resolve([]),
  ]);

  const isOwner = user.id === course.lecturerId;

  return (
    <div className="mx-auto max-w-4xl">
      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{course.code}</p>
      <h1 className="font-display mt-1 text-3xl font-semibold">{course.title}</h1>
      {course.description && <p className="mt-2 max-w-2xl text-muted-foreground">{course.description}</p>}

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Assignments</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {isOwner && <CreateAssignmentForm courseId={id} />}
              {assignments.length === 0 && (
                <p className="text-sm text-muted-foreground">No assignments yet.</p>
              )}
              {assignments.map((a) => (
                <Link
                  key={a.id}
                  href={`/assignments/${a.id}`}
                  className="flex items-center justify-between rounded-md border border-border p-3 text-sm hover:bg-muted"
                >
                  <div>
                    <div className="font-medium">{a.title}</div>
                    <div className="text-muted-foreground">
                      {a.dueDate ? `Due ${new Date(a.dueDate).toLocaleDateString()}` : "No due date"}
                    </div>
                  </div>
                  <Badge variant={a.status === "PUBLISHED" ? "default" : "outline"}>{a.status}</Badge>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>

        {user.role !== "STUDENT" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Enrolled students</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {enrollments.length === 0 && <p className="text-sm text-muted-foreground">No students enrolled yet.</p>}
              {enrollments.map((e) => (
                <div key={e.id} className="text-sm">
                  <div className="font-medium">{e.studentName}</div>
                  <div className="text-muted-foreground">{e.studentEmail}</div>
                </div>
              ))}
              <p className="mt-2 font-mono text-[11px] text-muted-foreground">Course ID: {course.id}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
