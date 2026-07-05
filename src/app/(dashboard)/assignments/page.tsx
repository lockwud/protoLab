import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { listAssignmentsForLecturer, listAssignmentsForStudent } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AssignmentsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const assignments =
    user.role === "STUDENT" ? await listAssignmentsForStudent(user.id) : await listAssignmentsForLecturer(user.id);

  return (
    <div className="mx-auto max-w-4xl">
      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Module 03</p>
      <h1 className="font-display mt-1 text-3xl font-semibold">Assignments</h1>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-base">{user.role === "STUDENT" ? "Due for you" : "Assignments you set"}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {assignments.length === 0 && (
            <p className="text-sm text-muted-foreground">
              {user.role === "STUDENT"
                ? "No assignments yet. Enroll in a course to see published assignments."
                : "You haven't created any assignments yet. Open a course to add one."}
            </p>
          )}
          {assignments.map((a) => (
            <Link
              key={a.id}
              href={`/assignments/${a.id}`}
              className="flex items-center justify-between rounded-md border border-border p-3 text-sm hover:bg-muted"
            >
              <div>
                <div className="font-medium">{a.title}</div>
                <div className="text-muted-foreground">{"courseTitle" in a ? a.courseTitle : ""}</div>
              </div>
              <Badge variant={a.status === "PUBLISHED" ? "default" : "outline"}>{a.status}</Badge>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
