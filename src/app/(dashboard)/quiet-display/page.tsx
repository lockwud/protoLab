import Link from "next/link";
import { ArrowUpRight, CheckCircle2, Moon, Presentation, Rocket } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { listAllProjects, listProjectsForOwner } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function QuietDisplayPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const projects = user.role === "STUDENT" ? await listProjectsForOwner(user.id) : await listAllProjects();
  const active = projects.filter((project) => project.status !== "DONE").slice(0, 4);

  return (
    <div className="mx-auto max-w-7xl">
      <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Presentation mode</p>
            <h1 className="font-display mt-1 text-3xl font-semibold">Quiet Display</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              A calm overview for studio critique, lecturer check-ins, projector display, or final prototype review.
            </p>
          </div>
          <Badge variant="outline">Low distraction</Badge>
        </div>
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <main className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-md bg-foreground text-background">
              <Presentation aria-hidden="true" className="size-5" />
            </span>
            <div>
              <h2 className="text-sm font-semibold">Active review queue</h2>
              <p className="text-xs text-muted-foreground">Prototype work without the surrounding operational noise.</p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {active.length === 0 && (
              <div className="rounded-md border border-dashed border-border p-5 text-sm text-muted-foreground md:col-span-2">
                No active prototypes yet.
              </div>
            )}
            {active.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`} className="rounded-md border border-border bg-background p-4 transition-colors hover:bg-muted/45">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold">{project.title}</h3>
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">{project.summary}</p>
                  </div>
                  <ArrowUpRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <Badge>{formatStatus(project.status)}</Badge>
                  <Badge variant="outline">Review</Badge>
                </div>
              </Link>
            ))}
          </div>
        </main>

        <aside className="space-y-5">
          <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-md bg-secondary text-secondary-foreground">
                <Moon aria-hidden="true" className="size-4" />
              </span>
              <div>
                <h2 className="text-sm font-semibold">Display rules</h2>
                <p className="text-[11px] text-muted-foreground">For critique and supervision.</p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {["Show only active work", "Keep status labels visible", "Use Build Lab for technical detail", "Use Repository for final archive"].map((rule) => (
                <div key={rule} className="flex gap-2 text-xs leading-5 text-muted-foreground">
                  <CheckCircle2 aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-accent-foreground" />
                  <span>{rule}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <h2 className="text-sm font-semibold">Quick launch</h2>
            <Button asChild size="sm" className="mt-4 h-8 bg-foreground text-[11px] text-background hover:bg-foreground/90">
              <Link href="/projects/new">
                <Rocket aria-hidden="true" className="size-3.5" />
                New prototype
              </Link>
            </Button>
          </section>
        </aside>
      </div>
    </div>
  );
}

function formatStatus(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}
