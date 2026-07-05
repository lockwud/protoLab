import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { listAssignmentsForStudent, listCoursesForStudent, listProjectsForOwner, listNotificationsForUser } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function StudentDashboard() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [courses, assignments, projects, notifications] = await Promise.all([
    listCoursesForStudent(user.id),
    listAssignmentsForStudent(user.id),
    listProjectsForOwner(user.id),
    listNotificationsForUser(user.id),
  ]);

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Student workspace</p>
        <h1 className="font-display mt-1 text-3xl font-semibold">Welcome back, {user.name.split(" ")[0]}</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Enrolled courses" value={courses.length} />
        <StatCard label="Assignments due" value={assignments.length} />
        <StatCard label="Active prototypes" value={projects.length} />
        <StatCard label="Unread notifications" value={unread} />
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming assignments</CardTitle>
            <CardDescription>Across your enrolled courses.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {assignments.length === 0 && (
              <EmptyState text="No assignments yet. Once a lecturer publishes one, it will show up here." />
            )}
            {assignments.slice(0, 5).map((a) => (
              <Link
                key={a.id}
                href={`/assignments/${a.id}`}
                className="flex items-center justify-between rounded-md border border-border p-3 text-sm hover:bg-muted"
              >
                <div>
                  <div className="font-medium">{a.title}</div>
                  <div className="text-muted-foreground">{a.courseTitle}</div>
                </div>
                <Badge variant="outline">{a.dueDate ? new Date(a.dueDate).toLocaleDateString() : "No due date"}</Badge>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your prototypes</CardTitle>
            <CardDescription>Projects in planning, build, or review.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {projects.length === 0 && <EmptyState text="You haven't started a prototype yet." />}
            {projects.slice(0, 5).map((p) => (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className="flex items-center justify-between rounded-md border border-border p-3 text-sm hover:bg-muted"
              >
                <div className="font-medium">{p.title}</div>
                <Badge>{p.status}</Badge>
              </Link>
            ))}
            <Button asChild size="sm" variant="outline" className="mt-2 self-start">
              <Link href="/projects/new">New prototype</Link>
            </Button>
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
