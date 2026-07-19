import Link from "next/link";
import {
  ArrowLeft,
  Bot,
  Cable,
  CheckCircle2,
  CircuitBoard,
  Code2,
  MessageSquare,
  MoreHorizontal,
  Network,
  Plus,
  Wrench,
} from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { listAllProjects, listProjectsForOwner } from "@/lib/data";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PrototypeShareButton } from "./prototype-actions";

type ProjectListItem = {
  id: string;
  title: string;
  summary: string;
  status: string;
  ownerName?: string;
};

const LAB_MODES = [
  { label: "Web prototype", icon: Code2, tone: "bg-secondary text-secondary-foreground" },
  { label: "Arduino / IoT", icon: CircuitBoard, tone: "bg-accent text-accent-foreground" },
  { label: "Networking lab", icon: Network, tone: "bg-[var(--amber)]/20 text-foreground" },
  { label: "Hardware assembly", icon: Wrench, tone: "bg-muted text-muted-foreground" },
];

export default async function ProjectsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const projects: ProjectListItem[] =
    user.role === "STUDENT"
      ? (await listProjectsForOwner(user.id)).map((p) => ({ ...p, ownerName: undefined }))
      : await listAllProjects();

  const activeProject = projects[0];
  const activeTitle = activeProject?.title ?? "Virtual networking lab";
  const activeSummary =
    activeProject?.summary ??
    "Assemble a four-room office network, terminate cables, place devices, and validate the prototype before physical installation.";
  const activeStatus = activeProject?.status ?? "PLANNING";
  const activeOwner = activeProject?.ownerName ?? user.name;
  const completed = projects.filter((project) => project.status === "DONE").length;
  const inMotion = projects.filter((project) => project.status !== "DONE").length;

  return (
    <div className="mx-auto max-w-7xl">
      <div className="grid min-h-[calc(100vh-8rem)] overflow-hidden rounded-lg border border-border bg-card shadow-sm xl:grid-cols-[250px_minmax(0,1fr)_320px]">
        <aside className="border-r border-border bg-background/50">
          <div className="border-b border-border p-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Prototype library</p>
            <h1 className="font-display mt-1 text-lg font-semibold">Studio</h1>
          </div>
          <div className="space-y-2 p-3">
            {projects.length === 0 && (
              <div className="rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
                No prototypes yet.
              </div>
            )}
            {projects.slice(0, 8).map((project, index) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className={`block rounded-md border p-3 text-xs transition-colors ${
                  index === 0 ? "border-foreground/20 bg-card shadow-sm" : "border-transparent hover:bg-muted"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-medium">{project.title}</span>
                  <Badge variant="outline" className="px-1.5 py-0 text-[9px]">
                    {formatStatus(project.status)}
                  </Badge>
                </div>
                <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-muted-foreground">{project.summary}</p>
                {project.ownerName && <p className="mt-2 text-[10px] text-muted-foreground">by {project.ownerName}</p>}
              </Link>
            ))}
          </div>
        </aside>

        <main className="min-w-0">
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ArrowLeft aria-hidden="true" className="size-4" />
              <span>Prototypes</span>
              <span>/</span>
              <span className="font-medium text-foreground">{activeTitle}</span>
            </div>
            <div className="flex items-center gap-2">
              <PrototypeShareButton
                title={activeTitle}
                summary={activeSummary}
                projectId={activeProject?.id}
                variant="icon"
              />
              {user.role === "STUDENT" && (
                <Button asChild size="sm" className="h-8 bg-foreground text-[11px] text-background hover:bg-foreground/90">
                  <Link href="/projects/new">
                    <Plus aria-hidden="true" />
                    New prototype
                  </Link>
                </Button>
              )}
            </div>
          </div>

          <div className="px-8 py-7">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Last sync: just now</p>
                <h2 className="font-display mt-2 text-3xl font-semibold">{activeTitle}</h2>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge>{formatStatus(activeStatus)}</Badge>
                  <Badge variant="outline">{projects.length} prototypes</Badge>
                  <Badge variant="outline">{completed} archived</Badge>
                </div>
              </div>
              <div className="flex -space-x-2">
                {[activeOwner, "AI", "Lab"].map((name) => (
                  <Avatar key={name} className="size-8 border-2 border-card text-[10px]">
                    {name.slice(0, 1).toUpperCase()}
                  </Avatar>
                ))}
              </div>
            </div>

            <section className="rounded-md border border-border bg-background">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-2">
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="font-medium text-foreground">Prototype brief</span>
                  <span>{activeProject ? "Live project" : "Starter lab"}</span>
                </div>
                <div className="flex items-center gap-1">
                  {["Plan", "Components", "Wire", "Validate"].map((item, index) => (
                    <span key={item} className={index === 0 ? "rounded bg-card px-2 py-1 text-[10px] shadow-sm" : "px-2 py-1 text-[10px] text-muted-foreground"}>
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              <div className="space-y-6 p-5 text-sm leading-6">
                <p>{activeSummary}</p>

                <div>
                  <h3 className="text-sm font-semibold">Lab modes</h3>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {LAB_MODES.map((mode) => {
                      const Icon = mode.icon;
                      return (
                        <div key={mode.label} className="flex items-center gap-3 rounded-md border border-border bg-card p-3">
                          <span className={`grid size-9 place-items-center rounded-md ${mode.tone}`}>
                            <Icon aria-hidden="true" className="size-4" />
                          </span>
                          <div>
                            <div className="text-xs font-medium">{mode.label}</div>
                            <div className="text-[11px] text-muted-foreground">Prototype, simulate, revise</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                  <Checklist
                    title="Build plan"
                    items={[
                      "Define the learning outcome and project constraints.",
                      "Generate a guided component list with AI support.",
                      "Assemble the virtual prototype or lab topology.",
                      "Validate wiring, logic, dependencies, and safety notes.",
                    ]}
                  />
                  <Checklist
                    title="Assessment evidence"
                    items={[
                      "Milestones, feedback, and GitHub updates stay attached.",
                      "Lecturers can review technical decisions and revisions.",
                      "Completed innovations move into the institutional repository.",
                      "Future departments can add lab templates without redesigning the platform.",
                    ]}
                  />
                </div>

                <div className="rounded-md border border-dashed border-border bg-card p-4">
                  <div className="mb-3 flex items-center gap-2 text-xs font-medium">
                    <Cable aria-hidden="true" className="size-4" />
                    Networking course case
                  </div>
                  <p className="text-xs leading-5 text-muted-foreground">
                    Terminate cable runs, place switches and access points, wire a four-room office, then let the AI guide test steps before the physical lab build.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </main>

        <aside className="border-l border-border bg-background/50">
          <div className="flex items-center justify-between border-b border-border p-4">
            <div className="flex items-center gap-2">
              <MessageSquare aria-hidden="true" className="size-4" />
              <h2 className="text-sm font-semibold">Supervision</h2>
            </div>
            <MoreHorizontal aria-hidden="true" className="size-4 text-muted-foreground" />
          </div>
          <div className="space-y-4 p-4">
            <ReviewNote
              author="AI guide"
              time="now"
              body="Start from project constraints, then choose a prototype mode. I can generate a component list, lab topology, or web screen flow."
              icon={Bot}
            />
            <ReviewNote
              author={user.role === "LECTURER" ? user.name : "Lecturer"}
              time="2 days ago"
              body="Keep evidence attached to each milestone so the final innovation can be reviewed and archived cleanly."
              icon={CheckCircle2}
            />
            <div className="rounded-md border border-border bg-card p-3">
              <div className="text-xs font-medium">Portfolio health</div>
              <div className="mt-3 space-y-3">
                <Progress label="Active prototypes" value={inMotion} total={Math.max(projects.length, 1)} />
                <Progress label="Repository-ready" value={completed} total={Math.max(projects.length, 1)} />
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Checklist({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="mt-2 space-y-2 text-xs text-muted-foreground">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <CheckCircle2 aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-accent-foreground" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ReviewNote({
  author,
  time,
  body,
  icon: Icon,
}: {
  author: string;
  time: string;
  body: string;
  icon: typeof Bot;
}) {
  return (
    <div className="rounded-md border border-border bg-card p-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="grid size-7 place-items-center rounded-full bg-secondary text-secondary-foreground">
          <Icon aria-hidden="true" className="size-3.5" />
        </span>
        <div>
          <div className="text-xs font-medium">{author}</div>
          <div className="text-[10px] text-muted-foreground">{time}</div>
        </div>
      </div>
      <p className="text-[11px] leading-4 text-muted-foreground">{body}</p>
    </div>
  );
}

function Progress({ label, value, total }: { label: string; value: number; total: number }) {
  const percent = Math.round((value / total) * 100);
  return (
    <div>
      <div className="mb-1 flex justify-between text-[11px]">
        <span>{label}</span>
        <span>{percent}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted">
        <div className="h-full rounded-full bg-foreground" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function formatStatus(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}
