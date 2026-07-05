import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { listAssignmentsForLecturer, listCoursesForLecturer, listAllProjects, listNotificationsForUser } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function LecturerDashboard() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [courses, assignments, projects, notifications] = await Promise.all([
    listCoursesForLecturer(user.id),
    listAssignmentsForLecturer(user.id),
    listAllProjects(),
    listNotificationsForUser(user.id),
  ]);

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Lecturer workspace</p>
        <h1 className="font-display mt-1 text-3xl font-semibold">Welcome back, {user.name.split(" ")[0]}</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Courses taught" value={courses.length} />
        <StatCard label="Assignments" value={assignments.length} />
        <StatCard label="Student prototypes" value={projects.length} />
        <StatCard label="Unread notifications" value={unread} />
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Your courses</CardTitle>
            <CardDescription>Manage enrollment and assignments.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {courses.length === 0 && <EmptyState text="You haven't created a course yet." />}
            {courses.slice(0, 5).map((c) => (
              <Link
                key={c.id}
                href={`/courses/${c.id}`}
                className="flex items-center justify-between rounded-md border border-border p-3 text-sm hover:bg-muted"
              >
                <div>
                  <div className="font-medium">{c.title}</div>
                  <div className="font-mono text-xs text-muted-foreground">{c.code}</div>
                </div>
              </Link>
            ))}
            <Button asChild size="sm" variant="outline" className="mt-2 self-start">
              <Link href="/courses">Manage courses</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Student prototypes</CardTitle>
            <CardDescription>Review progress and leave feedback.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {projects.length === 0 && <EmptyState text="No prototypes have been started yet." />}
            {projects.slice(0, 5).map((p) => (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className="flex items-center justify-between rounded-md border border-border p-3 text-sm hover:bg-muted"
              >
                <div>
                  <div className="font-medium">{p.title}</div>
                  <div className="text-muted-foreground">{p.ownerName}</div>
                </div>
                <Badge>{p.status}</Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="font-display text-3xl font-semibold">{value}</div>
        <div className="mt-1 text-sm text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">{text}</p>;
}
