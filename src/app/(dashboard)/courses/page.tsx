import { getCurrentUser } from "@/lib/session";
import { listAllCourses, listCoursesForLecturer, listCoursesForStudent } from "@/lib/data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { CreateCourseForm } from "./create-course-form";
import { EnrollForm } from "./enroll-form";

export default async function CoursesPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const courses =
    user.role === "LECTURER"
      ? await listCoursesForLecturer(user.id)
      : user.role === "ADMIN"
      ? await listAllCourses()
      : await listCoursesForStudent(user.id);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Module 02</p>
          <h1 className="font-display mt-1 text-3xl font-semibold">Courses</h1>
        </div>
      </div>

      {user.role === "LECTURER" && <CreateCourseForm />}
      {user.role === "STUDENT" && <EnrollForm />}

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {courses.length === 0 && (
          <p className="col-span-2 rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground">
            No courses yet.
          </p>
        )}
        {courses.map((c) => (
          <Link key={c.id} href={`/courses/${c.id}`}>
            <Card className="h-full transition-colors hover:bg-muted">
              <CardHeader>
                <CardTitle>{c.title}</CardTitle>
                <CardDescription className="font-mono">{c.code}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-2 text-sm text-muted-foreground">{c.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
