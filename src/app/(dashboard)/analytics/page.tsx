import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { query } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AnalyticsPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (user.role === "STUDENT") redirect("/dashboard/student");

  const [byStatus, submissionRate, milestoneProgress, activeStudents] = await Promise.all([
    query<{ status: string; count: string }>(`SELECT status, count(*) FROM "Project" GROUP BY status`),
    query<{ status: string; count: string }>(`SELECT status, count(*) FROM "Submission" GROUP BY status`),
    query<{ status: string; count: string }>(`SELECT status, count(*) FROM "Milestone" GROUP BY status`),
    query<{ count: string }>(`SELECT count(DISTINCT "studentId") FROM "Enrollment" WHERE status = 'ACTIVE'`),
  ]);

  return (
    <div className="mx-auto max-w-4xl">
      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Module 11</p>
      <h1 className="font-display mt-1 text-3xl font-semibold">Analytics</h1>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <StatBlock title="Active students" rows={[{ status: "Enrolled", count: String(activeStudents[0]?.count ?? 0) }]} />
        <StatBlock title="Prototypes by status" rows={byStatus} />
        <StatBlock title="Submissions by status" rows={submissionRate} />
        <StatBlock title="Milestones by status" rows={milestoneProgress} />
      </div>
    </div>
  );
}

function StatBlock({ title, rows }: { title: string; rows: { status: string; count: string }[] }) {
  const max = Math.max(1, ...rows.map((r) => Number(r.count)));
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {rows.length === 0 && <p className="text-sm text-muted-foreground">No data yet.</p>}
        {rows.map((r) => (
          <div key={r.status} className="flex items-center gap-3 text-sm">
            <div className="w-32 shrink-0 font-mono text-xs uppercase text-muted-foreground">{r.status}</div>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-primary" style={{ width: `${(Number(r.count) / max) * 100}%` }} />
            </div>
            <div className="w-8 text-right font-mono text-xs">{r.count}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
