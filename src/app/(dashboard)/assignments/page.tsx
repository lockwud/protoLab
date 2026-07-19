import Link from "next/link";
import { ArrowUpRight, CheckCircle2, Clock3, Plus, Search, SortAsc, UsersRound } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import {
  getSubmissionForStudent,
  listAssignmentsForLecturer,
  listAssignmentsForStudent,
  listSubmissionsForAssignment,
} from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { PrototypeInviteButton, PrototypeShareButton } from "../projects/prototype-actions";
import type { Assignment, SubmissionStatus } from "@/types";

type TaskItem = Assignment & {
  courseTitle?: string;
  courseCode?: string;
  submissionStatus?: SubmissionStatus;
  submissionCount?: number;
};

type Column = {
  title: string;
  description: string;
  tone: string;
  items: TaskItem[];
};

export default async function AssignmentsPage({ searchParams }: { searchParams: Promise<{ q?: string; view?: string; sort?: string }> }) {
  const params = await searchParams;
  const user = await getCurrentUser();
  if (!user) return null;

  const baseAssignments: TaskItem[] =
    user.role === "STUDENT" ? await listAssignmentsForStudent(user.id) : await listAssignmentsForLecturer(user.id);
  const hydratedAssignments =
    user.role === "STUDENT"
      ? await Promise.all(
          baseAssignments.map(async (task) => {
            const submission = await getSubmissionForStudent(task.id, user.id);
            return { ...task, submissionStatus: submission?.status ?? "NOT_SUBMITTED" };
          })
        )
      : await Promise.all(
          baseAssignments.map(async (task) => {
            const submissions = await listSubmissionsForAssignment(task.id);
            return { ...task, submissionCount: submissions.length };
          })
        );

  const query = params.q?.trim().toLowerCase() ?? "";
  const sort = params.sort === "due" ? "due" : "recent";
  const view = params.view ?? "atlas";
  const assignments = (query
    ? hydratedAssignments.filter((task) =>
        [task.title, task.description, task.courseTitle ?? "", task.courseCode ?? ""].some((value) => value.toLowerCase().includes(query))
      )
    : hydratedAssignments
  ).sort((a, b) => {
    if (sort === "due") return new Date(a.dueDate ?? "9999-12-31").getTime() - new Date(b.dueDate ?? "9999-12-31").getTime();
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  const columns = user.role === "STUDENT" ? studentColumns(assignments) : lecturerColumns(assignments);
  const published = assignments.filter((task) => task.status === "PUBLISHED").length;

  const completeCount = assignments.filter((task) => task.status === "CLOSED" || task.submissionStatus === "APPROVED").length;
  const completion = assignments.length ? Math.round((completeCount / assignments.length) * 100) : 0;

  return (
    <div className="mx-auto max-w-7xl">
      <div className="rounded-lg border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-5 border-b border-border p-5">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
            <div>
              <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Link href="/projects" className="hover:text-foreground">Projects</Link>
                <span>/</span>
                <span className="font-medium text-foreground">Atlas Task Board</span>
              </div>
              <h1 className="font-display text-2xl font-semibold">Atlas Project Tasks</h1>
              <p className="mt-2 max-w-2xl text-xs leading-5 text-muted-foreground">
                Track prototype briefs, lab builds, submissions, and lecturer review across web, IoT, Arduino, and networking work.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <PrototypeInviteButton title="Atlas Project Tasks" />
              <PrototypeShareButton
                title="Atlas Project Tasks"
                summary="Project task board for ProtoLab coursework, lab builds, submissions, and review."
              />
              <Link href="/courses" className="rounded-md border border-border bg-background px-3 py-1.5 text-xs hover:bg-muted">Edit</Link>
            </div>
          </div>

          <div className="grid gap-3 text-xs text-muted-foreground md:grid-cols-[180px_minmax(0,1fr)]">
            <div className="space-y-3">
              <MetaRow label="Status" value={`${published} published`} />
              <MetaRow label="Description" value="Prototype briefs and build evidence" />
              <MetaRow label="Assigned to" value={user.role === "STUDENT" ? user.name : "Course cohort"} />
              <MetaRow label="Timeline" value="Current semester" />
            </div>
            <div>
              <div>
                <div className="mb-2 flex items-center justify-between text-[11px]">
                  <span className="font-medium text-foreground">Project task completion</span>
                  <span>{completeCount}/{assignments.length} completed</span>
                </div>
                <div className="flex h-2 gap-1">
                  {[0, 1, 2, 3, 4, 5, 6, 7].map((step) => (
                    <span
                      key={step}
                      className={`h-full flex-1 rounded-full ${completion >= (step + 1) * 12.5 ? "bg-accent" : "bg-muted"}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-3 border-b border-border px-5 py-3 lg:flex-row lg:items-center">
          <div className="flex rounded-md border border-border bg-muted/30 p-1 text-[11px] font-medium">
            {["table", "atlas", "timeline"].map((tab) => (
              <Link
                key={tab}
                href={`/assignments?view=${tab}${query ? `&q=${encodeURIComponent(query)}` : ""}&sort=${sort}`}
                className={view === tab ? "rounded bg-card px-3 py-1 capitalize shadow-sm" : "px-3 py-1 capitalize text-muted-foreground hover:text-foreground"}
              >
                {tab}
              </Link>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <form action="/assignments" className="flex h-8 items-center gap-2 rounded-md border border-border bg-background px-3 text-xs text-muted-foreground">
              <Search aria-hidden="true" className="size-3.5" />
              <input name="q" defaultValue={query} placeholder="Search tasks" className="w-32 bg-transparent outline-none placeholder:text-muted-foreground" />
              <input type="hidden" name="view" value={view} />
              <input type="hidden" name="sort" value={sort} />
              <button type="submit" className="font-medium text-foreground">Go</button>
            </form>
            <Link href={`/assignments?view=${view}${query ? `&q=${encodeURIComponent(query)}` : ""}&sort=${sort === "due" ? "recent" : "due"}`} className="flex h-8 items-center gap-2 rounded-md border border-border bg-background px-3 text-xs hover:bg-muted">
              <SortAsc aria-hidden="true" className="size-3.5" />
              {sort === "due" ? "Recent" : "Due date"}
            </Link>
            {query && <Link href={`/assignments?view=${view}&sort=${sort}`} className="flex h-8 items-center rounded-md border border-border bg-background px-3 text-xs hover:bg-muted">Clear</Link>}
            <Link href="/courses" className="flex h-8 items-center gap-2 rounded-md bg-foreground px-3 text-xs text-background">
              <Plus aria-hidden="true" className="size-3.5" />
              Add Task
            </Link>
          </div>
        </div>

        <div className="grid gap-3 p-4 xl:grid-cols-4">
          {columns.map((column) => (
            <section key={column.title} className="min-h-[28rem] rounded-md border border-border bg-background">
              <div className="border-b border-border p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xs font-semibold">{column.title}</h2>
                    <p className="mt-1 text-[10px] text-muted-foreground">{column.description}</p>
                  </div>
                  <span className={`grid size-7 place-items-center rounded-md text-[11px] font-semibold ${column.tone}`}>
                    {column.items.length}
                  </span>
                </div>
              </div>

              <div className="space-y-3 p-3">
                {column.items.length === 0 && (
                  <div className="rounded-md border border-dashed border-border p-4 text-xs text-muted-foreground">
                    Nothing here yet.
                  </div>
                )}
                {column.items.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[86px_minmax(0,1fr)] gap-3">
      <span className="flex items-center gap-1.5">
        <UsersRound aria-hidden="true" className="size-3" />
        {label}
      </span>
      <span className="truncate font-medium text-foreground">{value}</span>
    </div>
  );
}

function TaskCard({ task }: { task: TaskItem }) {
  const overdue = task.dueDate ? new Date(task.dueDate) < new Date() : false;
  const dueSoon = isDueWithinDays(task.dueDate, 7);

  return (
    <Link href={`/assignments/${task.id}`} className="block rounded-md border border-border bg-background p-3 shadow-sm transition-colors hover:bg-muted/45">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="line-clamp-2 text-sm font-medium">{task.title}</div>
          <div className="mt-1 text-[11px] text-muted-foreground">{task.courseTitle ?? "Prototype lab"}</div>
        </div>
        <ArrowUpRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
      </div>
      <p className="mt-3 line-clamp-2 text-[11px] leading-4 text-muted-foreground">{task.description}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge variant={task.status === "PUBLISHED" ? "default" : "outline"} className="text-[10px]">
          {formatStatus(task.status)}
        </Badge>
        <span className={`inline-flex items-center gap-1 rounded px-2 py-1 text-[10px] ${overdue ? "bg-destructive/10 text-destructive" : dueSoon ? "bg-[var(--amber)]/20 text-foreground" : "bg-muted text-muted-foreground"}`}>
          <Clock3 aria-hidden="true" className="size-3" />
          {task.dueDate ? formatDate(task.dueDate) : "Open"}
        </span>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-[10px] text-muted-foreground">
        <span>{task.courseCode ?? "LAB"}</span>
        <span className="flex items-center gap-1">
          <CheckCircle2 aria-hidden="true" className="size-3" />
          {typeof task.submissionCount === "number" ? `${task.submissionCount} submissions` : formatStatus(task.submissionStatus ?? "NOT_SUBMITTED")}
        </span>
      </div>
    </Link>
  );
}

function studentColumns(tasks: TaskItem[]): Column[] {
  return [
    {
      title: "Backlog",
      description: "Published briefs to scope",
      tone: "bg-muted text-muted-foreground",
      items: tasks.filter((task) => task.submissionStatus === "NOT_SUBMITTED" && !isDueWithinDays(task.dueDate, 7) && !(task.dueDate && new Date(task.dueDate) < new Date())),
    },
    {
      title: "Build now",
      description: "Labs and prototypes due soon",
      tone: "bg-[var(--amber)]/20 text-foreground",
      items: tasks.filter((task) => task.submissionStatus === "NOT_SUBMITTED" && (isDueWithinDays(task.dueDate, 7) || Boolean(task.dueDate && new Date(task.dueDate) < new Date()))),
    },
    {
      title: "Submitted",
      description: "Waiting for supervision",
      tone: "bg-secondary text-secondary-foreground",
      items: tasks.filter((task) => task.submissionStatus === "SUBMITTED" || task.submissionStatus === "UNDER_REVIEW"),
    },
    {
      title: "Reviewed",
      description: "Approved or needs revision",
      tone: "bg-accent text-accent-foreground",
      items: tasks.filter((task) => task.submissionStatus === "APPROVED" || task.submissionStatus === "REVISION_REQUESTED"),
    },
  ];
}

function lecturerColumns(tasks: TaskItem[]): Column[] {
  return [
    {
      title: "Draft",
      description: "Briefs being prepared",
      tone: "bg-muted text-muted-foreground",
      items: tasks.filter((task) => task.status === "DRAFT"),
    },
    {
      title: "Published",
      description: "Available to students",
      tone: "bg-accent text-accent-foreground",
      items: tasks.filter((task) => task.status === "PUBLISHED"),
    },
    {
      title: "Review window",
      description: "Due soon or submitted",
      tone: "bg-[var(--amber)]/20 text-foreground",
      items: tasks.filter((task) => isDueWithinDays(task.dueDate, 7) || (task.submissionCount ?? 0) > 0),
    },
    {
      title: "Closed",
      description: "Ready for archive",
      tone: "bg-secondary text-secondary-foreground",
      items: tasks.filter((task) => task.status === "CLOSED"),
    },
  ];
}

function isDueWithinDays(value: string | null, days: number) {
  if (!value) return false;
  const now = new Date();
  const due = new Date(value);
  const diff = due.getTime() - now.getTime();
  return diff >= 0 && diff <= days * 24 * 60 * 60 * 1000;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatStatus(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}
