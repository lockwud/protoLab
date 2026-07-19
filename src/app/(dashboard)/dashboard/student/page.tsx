import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  CircleAlert,
  Clock3,
  Network,
  Rocket,
  Sparkles,
} from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { listAssignmentsForStudent, listCoursesForStudent, listProjectsForOwner } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function StudentDashboard() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [courses, assignments, projects] = await Promise.all([
    listCoursesForStudent(user.id),
    listAssignmentsForStudent(user.id),
    listProjectsForOwner(user.id),
  ]);

  const nextAssignment = assignments.find((assignment) => assignment.dueDate);
  const activeProjects = projects.filter((project) => project.status !== "DONE").length;
  const repoBackedProjects = projects.filter((project) => project.githubRepoUrl).length;
  const publishedAssignments = assignments.length;
  const dueSoon = assignments.filter((assignment) => isDueWithinDays(assignment.dueDate, 7)).length;
  const completeProjects = projects.filter((project) => project.status === "DONE").length;
  const progressPercent = projects.length ? Math.round((completeProjects / projects.length) * 100) : 0;
  const currentProject = projects[0];
  const recentItems = [
    ...assignments.slice(0, 2).map((assignment) => ({
      id: assignment.id,
      title: assignment.title,
      href: `/assignments/${assignment.id}`,
      type: "Project Task",
    })),
    ...projects.slice(0, 2).map((project) => ({
      id: project.id,
      title: project.title,
      href: `/projects/${project.id}`,
      type: "Prototype",
    })),
  ].slice(0, 4);

  return (
    <div className="mx-auto max-w-7xl">
      <section className="mb-5 overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Dashboard</p>
            <h1 className="font-display mt-1 text-3xl font-semibold">Build desk</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Last sync: {formatDate(new Date().toISOString())}. Plan prototypes, build virtual labs, connect GitHub, and move evidence toward lecturer review.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/build-lab" className="inline-flex h-9 items-center gap-2 rounded-md bg-foreground px-3 text-xs font-medium text-background hover:bg-foreground/90">
                <Rocket aria-hidden="true" className="size-4" />
                Open Build Lab
              </Link>
              <Link href="/assignments" className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-background px-3 text-xs font-medium hover:bg-muted">
                <CircleAlert aria-hidden="true" className="size-4" />
                Review project tasks
              </Link>
            </div>
          </div>
          <div className="rounded-md border border-border bg-background p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold">Workspace readiness</div>
                <div className="mt-1 text-[11px] text-muted-foreground">Courses, builds, repository links</div>
              </div>
              <span className="grid size-9 place-items-center rounded-md bg-accent text-accent-foreground">
                <Sparkles aria-hidden="true" className="size-4" />
              </span>
            </div>
            <div className="mt-5 space-y-3">
              <ReadinessRow label="Course context" value={courses.length ? "Connected" : "Join course"} active={courses.length > 0} />
              <ReadinessRow label="Prototype lab" value={projects.length ? `${projects.length} active` : "Not started"} active={projects.length > 0} />
              <ReadinessRow label="GitHub evidence" value={repoBackedProjects ? `${repoBackedProjects} linked` : "Pending"} active={repoBackedProjects > 0} />
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Active courses" value={courses.length} detail="Learning tracks" trend="+6%" icon={BookOpen} />
        <MetricDial label="Project tasks" value={publishedAssignments} percent={assignments.length ? 68 : 0} detail={nextAssignment?.dueDate ? `Next ${formatDate(nextAssignment.dueDate)}` : "Nothing scheduled"} />
        <StatCard label="Build labs" value={activeProjects} detail="Prototypes moving" trend="+12%" icon={Network} />
        <MetricDial label="Repo linked" value={repoBackedProjects} percent={projects.length ? Math.round((repoBackedProjects / projects.length) * 100) : 0} detail="GitHub connected" />
        <StatCard label="Due this week" value={dueSoon} detail="Needs attention" trend={dueSoon ? "Focus" : "Stable"} icon={CircleAlert} />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.08fr_0.72fr_0.86fr]">
        <Card className="overflow-hidden bg-card">
          <CardHeader className="flex-row items-start justify-between gap-4 border-b border-border/70 pb-4">
            <div>
              <CardTitle className="text-sm">Build momentum</CardTitle>
              <CardDescription className="text-[11px]">Project tasks, milestones, and prototype progress.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="rounded-md">{new Date().getFullYear()}</Badge>
              <Button asChild variant="ghost" size="icon" className="size-8">
                <Link href="/projects" aria-label="Open projects">
                  <ArrowUpRight aria-hidden="true" className="size-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
              <div>
                <div className="font-display text-2xl font-semibold">{assignments.length + projects.length} active items</div>
                <p className="mt-1 text-[11px] text-muted-foreground">Coursework plus build-lab work in progress.</p>
              </div>
              <div className="flex rounded-md border border-border bg-muted/40 p-1 text-[11px] font-medium">
                {["Week 1", "Week 2", "Week 3", "Week 4"].map((week, index) => (
                  <span key={week} className={index === 1 ? "rounded bg-card px-3 py-1 shadow-sm" : "px-3 py-1 text-muted-foreground"}>
                    {week}
                  </span>
                ))}
              </div>
            </div>
            <div className="relative h-52 overflow-hidden rounded-md border border-border bg-background">
              <div className="absolute inset-x-0 bottom-0 top-10 bg-[repeating-linear-gradient(135deg,transparent_0,transparent_14px,var(--muted)_14px,var(--muted)_25px)] opacity-70" />
              <div className="absolute inset-x-4 top-12 h-px bg-border" />
              <div className="absolute inset-x-4 top-28 h-px bg-border" />
              <div className="absolute inset-x-4 top-44 h-px bg-border" />
              <div className="absolute inset-x-6 bottom-5 flex justify-between text-[10px] text-muted-foreground">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <span key={day}>{day}</span>)}
              </div>
              <div className="absolute left-[43%] top-0 h-full border-l border-dashed border-foreground/35" />
              <div className="absolute bottom-11 left-[39%] h-28 w-10 rounded-t bg-foreground" />
              <div className="absolute bottom-[93px] left-[42.5%] size-3 rounded-full border-2 border-background bg-accent" />
              <div className="absolute bottom-10 left-[46%] size-3 rounded-full border-2 border-background bg-[var(--amber)]" />
              <div className="absolute left-[50%] top-14 w-36 rounded-md border border-border bg-card p-2.5 shadow-lg">
                <div className="font-display text-lg font-semibold">{Math.max(progressPercent, assignments.length ? 57 : 0)}%</div>
                <div className="text-[11px] text-muted-foreground">Lab readiness</div>
                <div className="mt-3 flex gap-3 text-[11px]">
                  <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-accent" />{completeProjects} done</span>
                  <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-[var(--amber)]" />{activeProjects} active</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <RecentWorkPie
          projectTasks={publishedAssignments}
          prototypes={projects.length}
          dueSoon={dueSoon}
          items={recentItems}
        />

        <Card className="bg-card">
          <CardHeader className="flex-row items-start justify-between gap-4 border-b border-border/70 pb-4">
            <div>
              <CardTitle className="text-sm">Current build lab</CardTitle>
              <CardDescription className="text-xs">{currentProject ? currentProject.title : "No prototype selected"}</CardDescription>
            </div>
            <Button asChild variant="ghost" size="icon" className="size-8">
              <Link href={currentProject ? `/projects/${currentProject.id}` : "/projects"} aria-label="Open prototypes">
                <ArrowUpRight aria-hidden="true" className="size-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-5">
            {currentProject ? (
              <>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex -space-x-2">
                    {[user.name, "AI", "Git"].map((name) => (
                      <span key={name} className="grid size-8 place-items-center rounded-full border-2 border-card bg-secondary text-[10px] font-semibold text-secondary-foreground">
                        {name.slice(0, 1).toUpperCase()}
                      </span>
                    ))}
                  </div>
                  <Badge>{formatStatus(currentProject.status)}</Badge>
                </div>
                <p className="line-clamp-3 text-xs leading-5 text-muted-foreground">{currentProject.summary}</p>
                <div className="mt-5">
                  <div className="mb-2 flex justify-between text-xs">
                    <span className="font-medium">Progress</span>
                    <span>{Math.max(progressPercent, 64)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div className="h-full rounded-full bg-foreground" style={{ width: `${Math.max(progressPercent, 64)}%` }} />
                  </div>
                </div>
                <div className="mt-6 space-y-3 border-t border-border pt-5">
                  <TimelineRow label="Open visual Build Lab" date={formatDate(currentProject.updatedAt)} href={`/projects/${currentProject.id}`} />
                  <TimelineRow label={currentProject.githubRepoUrl ? "Review GitHub evidence" : "Connect GitHub evidence"} date="Next step" href={`/projects/${currentProject.id}`} />
                </div>
              </>
            ) : (
              <EmptyState text="Start a prototype to unlock build status, repository health, and feedback timeline." />
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
    <Card className="bg-card shadow-sm">
      <CardContent className="p-4">
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
    <Card className="bg-card shadow-sm">
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

function ReadinessRow({ label, value, active }: { label: string; value: string; active: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="flex items-center gap-2 text-muted-foreground">
        <span className={`size-2 rounded-full ${active ? "bg-accent" : "bg-muted"}`} />
        {label}
      </span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function RecentWorkPie({
  projectTasks,
  prototypes,
  dueSoon,
  items,
}: {
  projectTasks: number;
  prototypes: number;
  dueSoon: number;
  items: Array<{ id: string; title: string; href: string; type: string }>;
}) {
  const total = Math.max(projectTasks + prototypes + dueSoon, 1);
  const taskEnd = Math.round((projectTasks / total) * 100);
  const prototypeEnd = Math.round(((projectTasks + prototypes) / total) * 100);

  return (
    <Card className="bg-card shadow-sm">
      <CardHeader className="border-b border-border/70 pb-4">
        <CardTitle className="text-sm">Recent work</CardTitle>
        <CardDescription className="text-[11px]">Project task mix and active build balance.</CardDescription>
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
                <div className="text-[10px] text-muted-foreground">active</div>
              </div>
            </div>
          </div>
          <div className="mt-4 grid w-full gap-2 text-left text-[11px]">
            <PieLegend color="bg-foreground" label="Project tasks" value={projectTasks} />
            <PieLegend color="bg-accent" label="Prototypes" value={prototypes} />
            <PieLegend color="bg-[var(--amber)]" label="Due soon" value={dueSoon} />
          </div>
          <div className="mt-4 w-full space-y-2 border-t border-border pt-4">
            {items.length === 0 && <EmptyState text="No recent work yet." />}
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

function TimelineRow({ label, date, href }: { label: string; date: string; href: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid size-7 place-items-center rounded-full bg-muted">
          <Clock3 aria-hidden="true" className="size-3.5" />
        </span>
        <div className="min-w-0">
          <div className="truncate font-medium">{label}</div>
          <div className="text-[11px] text-muted-foreground">{date}</div>
        </div>
      </div>
      <Button asChild variant="outline" size="sm" className="h-7 bg-background px-2 text-[11px]">
        <Link href={href}>View</Link>
      </Button>
    </div>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatStatus(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function isDueWithinDays(value: string | null, days: number) {
  if (!value) return false;
  const now = new Date();
  const due = new Date(value);
  const diff = due.getTime() - now.getTime();
  return diff >= 0 && diff <= days * 24 * 60 * 60 * 1000;
}

function EmptyState({ text }: { text: string }) {
  return <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">{text}</p>;
}
