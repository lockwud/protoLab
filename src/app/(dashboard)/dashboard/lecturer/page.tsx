import Link from "next/link";
import {
  ArrowUpRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  CircuitBoard,
  FolderKanban,
  GraduationCap,
  Library,
  Rocket,
} from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { listAssignmentsForLecturer, listCoursesForLecturer, listAllProjects, listNotificationsForUser } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const LECTURER_FLOW = [
  { title: "Courses", href: "/courses", icon: BookOpen, detail: "Create cohort spaces" },
  { title: "Project Tasks", href: "/assignments", icon: FolderKanban, detail: "Publish briefs" },
  { title: "Build Lab", href: "/build-lab", icon: CircuitBoard, detail: "Inspect simulations" },
  { title: "Prototypes", href: "/projects", icon: Rocket, detail: "Review student builds" },
  { title: "Analytics", href: "/analytics", icon: BarChart3, detail: "Track progress" },
  { title: "Repository", href: "/repository", icon: Library, detail: "Archive innovations" },
];

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
  const publishedAssignments = assignments.filter((assignment) => assignment.status === "PUBLISHED").length;
  const activeProjects = projects.filter((project) => project.status !== "DONE").length;
  const reviewedProjects = projects.filter((project) => project.status === "DONE").length;
  const reviewPercent = projects.length ? Math.round((reviewedProjects / projects.length) * 100) : 0;
  const reviewItems = [
    ...projects.slice(0, 2).map((project) => ({
      id: project.id,
      title: project.title,
      href: `/projects/${project.id}`,
      type: "Prototype",
    })),
    ...assignments.slice(0, 2).map((assignment) => ({
      id: assignment.id,
      title: assignment.title,
      href: `/assignments/${assignment.id}`,
      type: "Project Task",
    })),
  ].slice(0, 4);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-5 flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Lecturer dashboard</p>
          <h1 className="font-display mt-1 text-2xl font-semibold">Supervision desk</h1>
          <p className="mt-1 max-w-xl text-xs text-muted-foreground">
            Last sync: {formatDate(new Date().toISOString())}. Courses, project tasks, build labs, prototypes, analytics, and repository outcomes.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline" className="h-8 bg-card text-[11px]">
            <Link href="/courses">
              <BookOpen aria-hidden="true" className="size-3.5" />
              Course setup
            </Link>
          </Button>
          <Button asChild size="sm" className="h-8 bg-foreground text-[11px] text-background hover:bg-foreground/90">
            <Link href="/assignments">
              <FolderKanban aria-hidden="true" className="size-3.5" />
              Publish task
            </Link>
          </Button>
        </div>
      </div>

      <section className="mb-5 rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">Correct teaching workflow</h2>
            <p className="mt-1 text-[11px] text-muted-foreground">Follow this order to keep assessment, build evidence, and repository publishing connected.</p>
          </div>
          <Badge variant="outline">Institutional setup</Badge>
        </div>
        <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-6">
          {LECTURER_FLOW.map((step, index) => {
            const Icon = step.icon;
            return (
              <Link key={step.href} href={step.href} className="rounded-md border border-border bg-background p-3 transition-colors hover:bg-muted/45">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="grid size-8 place-items-center rounded-md bg-secondary text-secondary-foreground">
                    <Icon aria-hidden="true" className="size-4" />
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">0{index + 1}</span>
                </div>
                <div className="text-xs font-semibold">{step.title}</div>
                <div className="mt-1 text-[10px] text-muted-foreground">{step.detail}</div>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Courses taught" value={courses.length} detail="Managed cohorts" trend="+4%" icon={BookOpen} />
        <MetricDial label="Project tasks" value={assignments.length} percent={assignments.length ? Math.round((publishedAssignments / assignments.length) * 100) : 0} detail={`${publishedAssignments} published`} />
        <StatCard label="Student builds" value={projects.length} detail={`${activeProjects} active`} trend="+18%" icon={GraduationCap} />
        <MetricDial label="Unread signals" value={unread} percent={unread ? 76 : 0} detail="Notifications" />
        <StatCard label="Completed" value={reviewedProjects} detail="Prototype reviews" trend={`${reviewPercent}%`} icon={CheckCircle2} />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.15fr_0.68fr_0.82fr]">
        <Card className="overflow-hidden bg-card">
          <CardHeader className="flex-row items-start justify-between gap-4 border-b border-border/70 pb-4">
            <div>
              <CardTitle className="text-sm">Cohort overview</CardTitle>
              <CardDescription className="text-[11px]">Published work and prototype review flow.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="rounded-md">{new Date().getFullYear()}</Badge>
              <Button asChild variant="ghost" size="icon" className="size-8">
                <Link href="/analytics" aria-label="Open analytics">
                  <ArrowUpRight aria-hidden="true" className="size-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
              <div>
                <div className="font-display text-2xl font-semibold">{assignments.length + projects.length} active items</div>
                <p className="mt-1 text-[11px] text-muted-foreground">Project tasks plus student prototypes that may need eyes.</p>
              </div>
              <div className="flex rounded-md border border-border bg-muted/40 p-1 text-[11px] font-medium">
                {["Draft", "Live", "Review", "Archive"].map((label, index) => (
                  <span key={label} className={index === 2 ? "rounded bg-card px-3 py-1 shadow-sm" : "px-3 py-1 text-muted-foreground"}>
                    {label}
                  </span>
                ))}
              </div>
            </div>
            <div className="relative h-48 overflow-hidden rounded-md border border-border bg-background">
              <div className="absolute inset-x-0 bottom-0 top-10 bg-[repeating-linear-gradient(135deg,transparent_0,transparent_14px,var(--muted)_14px,var(--muted)_25px)] opacity-70" />
              <div className="absolute inset-x-4 top-12 h-px bg-border" />
              <div className="absolute inset-x-4 top-28 h-px bg-border" />
              <div className="absolute inset-x-4 top-44 h-px bg-border" />
              <div className="absolute inset-x-6 bottom-5 flex justify-between text-[10px] text-muted-foreground">
                {["Courses", "Drafts", "Published", "Builds", "Reviews", "Done"].map((label) => <span key={label}>{label}</span>)}
              </div>
              <div className="absolute left-[58%] top-0 h-full border-l border-dashed border-foreground/35" />
              <div className="absolute bottom-11 left-[54%] h-28 w-10 rounded-t bg-foreground" />
              <div className="absolute bottom-[105px] left-[57.5%] size-3 rounded-full border-2 border-background bg-accent" />
              <div className="absolute bottom-10 left-[61%] size-3 rounded-full border-2 border-background bg-[var(--amber)]" />
              <div className="absolute left-[25%] top-16 h-1.5 w-[52%] rounded-full bg-foreground/20">
                <div className="h-full rounded-full bg-foreground" style={{ width: `${Math.max(reviewPercent, 42)}%` }} />
              </div>
              <div className="absolute left-[63%] top-12 w-36 rounded-md border border-border bg-card p-2.5 shadow-lg">
                <div className="font-display text-lg font-semibold">{Math.max(reviewPercent, 42)}%</div>
                <div className="text-[11px] text-muted-foreground">Review completion</div>
                <div className="mt-3 flex gap-3 text-[11px]">
                  <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-accent" />{reviewedProjects} done</span>
                  <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-[var(--amber)]" />{activeProjects} active</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <RecentWorkPie
          projectTasks={assignments.length}
          prototypes={projects.length}
          unread={unread}
          items={reviewItems}
        />

        <Card className="bg-card">
          <CardHeader className="flex-row items-start justify-between gap-4 border-b border-border/70 pb-4">
            <div>
              <CardTitle className="text-sm">Course overview</CardTitle>
              <CardDescription className="text-xs">{courses[0] ? courses[0].title : "No course selected"}</CardDescription>
            </div>
            <Button asChild variant="ghost" size="icon" className="size-8">
              <Link href={courses[0] ? `/courses/${courses[0].id}` : "/courses"} aria-label="Open courses">
                <ArrowUpRight aria-hidden="true" className="size-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-5">
            {courses.length === 0 ? (
              <EmptyState text="Create a course to start publishing project tasks and reviewing prototypes." />
            ) : (
              <div className="space-y-3">
                {courses.slice(0, 4).map((course) => (
                  <Link key={course.id} href={`/courses/${course.id}`} className="flex items-center justify-between gap-3 rounded-md border border-border bg-background p-3 text-sm transition-colors hover:bg-muted/50">
                    <div className="min-w-0">
                      <div className="truncate font-medium">{course.title}</div>
                      <div className="font-mono text-[11px] text-muted-foreground">{course.code}</div>
                    </div>
                    <ArrowUpRight aria-hidden="true" className="size-4 text-muted-foreground" />
                  </Link>
                ))}
                <div className="mt-5 border-t border-border pt-5">
                  <div className="mb-2 flex justify-between text-xs">
                    <span className="font-medium">Publishing coverage</span>
                    <span>{assignments.length ? Math.round((publishedAssignments / assignments.length) * 100) : 0}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div className="h-full rounded-full bg-foreground" style={{ width: `${assignments.length ? Math.round((publishedAssignments / assignments.length) * 100) : 0}%` }} />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  detail,
  trend,
  icon: Icon,
}: {
  label: string;
  value: number;
  detail: string;
  trend: string;
  icon: typeof BookOpen;
}) {
  return (
    <Card className="bg-card">
      <CardContent className="p-3">
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="text-[11px] font-medium">{label}</span>
          <span className="grid size-6 place-items-center rounded-md border border-border bg-background">
            <Icon aria-hidden="true" className="size-3.5" />
          </span>
        </div>
        <div className="flex items-end gap-2">
          <div className="font-display text-2xl font-semibold">{value}</div>
          <span className="mb-0.5 text-[10px] font-medium text-accent-foreground">{trend}</span>
        </div>
        <div className="mt-1 text-[11px] text-muted-foreground">{detail}</div>
      </CardContent>
    </Card>
  );
}

function MetricDial({ label, value, percent, detail }: { label: string; value: number; percent: number; detail: string }) {
  return (
    <Card className="bg-card">
      <CardContent className="flex h-full items-center gap-3 p-3">
      <div
        className="grid size-14 shrink-0 place-items-center rounded-full"
        style={{ background: `conic-gradient(var(--foreground) ${percent}%, var(--muted) 0)` }}
      >
        <div className="grid size-10 place-items-center rounded-full bg-card">
          <span className="font-display text-sm font-semibold">{value}</span>
        </div>
      </div>
      <div className="min-w-0">
        <div className="text-[11px] font-medium">{label}</div>
        <div className="mt-0.5 text-[10px] text-muted-foreground">{detail}</div>
        <div className="mt-1 font-mono text-[10px] text-accent-foreground">{percent}%</div>
      </div>
      </CardContent>
    </Card>
  );
}

function RecentWorkPie({
  projectTasks,
  prototypes,
  unread,
  items,
}: {
  projectTasks: number;
  prototypes: number;
  unread: number;
  items: Array<{ id: string; title: string; href: string; type: string }>;
}) {
  const total = Math.max(projectTasks + prototypes + unread, 1);
  const taskEnd = Math.round((projectTasks / total) * 100);
  const prototypeEnd = Math.round(((projectTasks + prototypes) / total) * 100);

  return (
    <Card className="bg-card">
      <CardHeader className="border-b border-border/70 pb-4">
        <CardTitle className="text-sm">Review mix</CardTitle>
        <CardDescription className="text-[11px]">Project tasks, prototypes, and unread signals.</CardDescription>
      </CardHeader>
      <CardContent className="p-5">
        <div className="flex flex-col items-center text-center">
          <div
            className="grid size-36 place-items-center rounded-full"
            style={{
              background: `conic-gradient(var(--foreground) 0 ${taskEnd}%, var(--accent) ${taskEnd}% ${prototypeEnd}%, var(--amber) ${prototypeEnd}% 100%)`,
            }}
          >
            <div className="grid size-24 place-items-center rounded-full bg-card">
              <div>
                <div className="font-display text-2xl font-semibold">{projectTasks + prototypes}</div>
                <div className="text-[10px] text-muted-foreground">items</div>
              </div>
            </div>
          </div>
          <div className="mt-4 grid w-full gap-2 text-left text-[11px]">
            <PieLegend color="bg-foreground" label="Project tasks" value={projectTasks} />
            <PieLegend color="bg-accent" label="Prototypes" value={prototypes} />
            <PieLegend color="bg-[var(--amber)]" label="Unread" value={unread} />
          </div>
          <div className="mt-4 w-full space-y-2 border-t border-border pt-4">
            {items.length === 0 && <EmptyState text="No review work yet." />}
            {items.map((item) => (
              <Link key={`${item.type}-${item.id}`} href={item.href} className="flex items-center justify-between gap-3 rounded-md bg-background px-3 py-2 text-left text-[11px] hover:bg-muted">
                <span className="truncate font-medium">{item.title}</span>
                <span className="shrink-0 text-[10px] text-muted-foreground">{item.type}</span>
              </Link>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PieLegend({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-2">
        <span className={`size-2 rounded-full ${color}`} />
        {label}
      </span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function EmptyState({ text }: { text: string }) {
  return <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">{text}</p>;
}
