import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, BarChart3, CheckCircle2, FolderKanban, GraduationCap, Rocket } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { query } from "@/lib/db";
import { Badge } from "@/components/ui/badge";

export default async function AnalyticsPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (user.role === "STUDENT") redirect("/dashboard/student");

  const [byStatus, submissionRate, milestoneProgress, activeStudents, courseCount, taskCount] = await Promise.all([
    query<{ status: string; count: string }>(`SELECT status, count(*) FROM "Project" GROUP BY status ORDER BY status ASC`),
    query<{ status: string; count: string }>(`SELECT status, count(*) FROM "Submission" GROUP BY status ORDER BY status ASC`),
    query<{ status: string; count: string }>(`SELECT status, count(*) FROM "Milestone" GROUP BY status ORDER BY status ASC`),
    query<{ count: string }>(`SELECT count(DISTINCT "studentId") FROM "Enrollment" WHERE status = 'ACTIVE'`),
    query<{ count: string }>(`SELECT count(*) FROM "Course"`),
    query<{ count: string }>(`SELECT count(*) FROM "Assignment"`),
  ]);

  const projectsTotal = byStatus.reduce((sum, row) => sum + Number(row.count), 0);
  const submissionsTotal = submissionRate.reduce((sum, row) => sum + Number(row.count), 0);
  const milestonesTotal = milestoneProgress.reduce((sum, row) => sum + Number(row.count), 0);
  const doneMilestones = milestoneProgress.find((row) => row.status === "DONE");
  const milestoneCompletion = milestonesTotal ? Math.round((Number(doneMilestones?.count ?? 0) / milestonesTotal) * 100) : 0;

  return (
    <div className="mx-auto max-w-7xl">
      <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Lecturer analytics</p>
            <h1 className="font-display mt-1 text-3xl font-semibold">Institutional Signals</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Track course setup, project task publishing, prototype progress, submission review, and milestone completion.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{new Date().getFullYear()}</Badge>
            <Badge variant="outline">Review dashboard</Badge>
          </div>
        </div>
      </section>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Metric label="Courses" value={Number(courseCount[0]?.count ?? 0)} detail="Learning spaces" icon={GraduationCap} href="/courses" />
        <Metric label="Project tasks" value={Number(taskCount[0]?.count ?? 0)} detail="Briefs and submissions" icon={FolderKanban} href="/assignments" />
        <Metric label="Prototypes" value={projectsTotal} detail="Student builds" icon={Rocket} href="/projects" />
        <Metric label="Students" value={Number(activeStudents[0]?.count ?? 0)} detail="Active enrollments" icon={GraduationCap} href="/courses" />
        <Metric label="Milestones" value={milestoneCompletion} suffix="%" detail="Completed" icon={CheckCircle2} href="/projects" />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <StatusPanel title="Prototype status" rows={byStatus} />
        <StatusPanel title="Submission review" rows={submissionRate} />
        <StatusPanel title="Milestone progress" rows={milestoneProgress} />
      </div>

      <section className="mt-5 rounded-lg border border-border bg-card p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">Workflow health</h2>
            <p className="mt-1 text-xs text-muted-foreground">Healthy cohorts should show tasks published, prototypes active, and milestones moving to Done.</p>
          </div>
          <Link href="/dashboard/lecturer" className="flex h-8 items-center gap-2 rounded-md border border-border bg-background px-3 text-xs hover:bg-muted">
            Lecturer desk
            <ArrowUpRight aria-hidden="true" className="size-3.5" />
          </Link>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          <HealthStep title="Course setup" value={Number(courseCount[0]?.count ?? 0)} />
          <HealthStep title="Tasks published" value={Number(taskCount[0]?.count ?? 0)} />
          <HealthStep title="Builds active" value={projectsTotal} />
          <HealthStep title="Evidence reviewed" value={submissionsTotal} />
        </div>
      </section>
    </div>
  );
}

function Metric({
  label,
  value,
  suffix = "",
  detail,
  icon: Icon,
  href,
}: {
  label: string;
  value: number;
  suffix?: string;
  detail: string;
  icon: typeof BarChart3;
  href: string;
}) {
  return (
    <Link href={href} className="rounded-lg border border-border bg-card p-4 shadow-sm transition-colors hover:bg-muted/45">
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="text-[11px] font-medium">{label}</span>
        <span className="grid size-7 place-items-center rounded-md border border-border bg-background">
          <Icon aria-hidden="true" className="size-3.5" />
        </span>
      </div>
      <div className="font-display text-2xl font-semibold">{value}{suffix}</div>
      <div className="mt-1 text-[11px] text-muted-foreground">{detail}</div>
    </Link>
  );
}

function StatusPanel({ title, rows }: { title: string; rows: { status: string; count: string }[] }) {
  const max = Math.max(1, ...rows.map((row) => Number(row.count)));
  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <h2 className="text-sm font-semibold">{title}</h2>
      <div className="mt-4 space-y-3">
        {rows.length === 0 && <p className="rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">No data yet.</p>}
        {rows.map((row) => (
          <div key={row.status}>
            <div className="mb-1 flex items-center justify-between gap-3 text-[11px]">
              <span className="font-medium">{formatStatus(row.status)}</span>
              <span className="font-mono text-muted-foreground">{row.count}</span>
            </div>
            <div className="h-2 rounded-full bg-muted">
              <div className="h-full rounded-full bg-foreground" style={{ width: `${(Number(row.count) / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function HealthStep({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-md border border-border bg-background p-4">
      <div className="font-display text-xl font-semibold">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{title}</div>
    </div>
  );
}

function formatStatus(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}
