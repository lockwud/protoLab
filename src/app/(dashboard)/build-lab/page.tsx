import Link from "next/link";
import { ArrowUpRight, CircuitBoard, Network, Plus, Rocket, Wrench } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { listAllProjects, listMilestonesForProject, listProjectsForOwner } from "@/lib/data";
import { VisualLabWorkspace } from "./visual-lab-workspace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function BuildLabPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const projects =
    user.role === "STUDENT"
      ? await listProjectsForOwner(user.id)
      : await listAllProjects();

  const activeProject = projects[0];
  const milestones = activeProject ? await listMilestonesForProject(activeProject.id) : [];

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-5 rounded-lg border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Prototype workspace</p>
            <h1 className="font-display mt-1 text-3xl font-semibold">Build Lab</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Build and validate software screens, Arduino or IoT plans, circuit assemblies, and networking labs from your saved prototype projects.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="rounded-md">{projects.length} prototypes</Badge>
            <Badge variant="outline" className="rounded-md">{milestones.length} milestones</Badge>
            <Button asChild size="sm" className="bg-foreground text-background hover:bg-foreground/90">
              <Link href="/projects/new">
                <Plus aria-hidden="true" />
                New prototype
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <LabMode label="Web/app screens" icon={Rocket} />
          <LabMode label="Arduino / IoT" icon={CircuitBoard} />
          <LabMode label="Networking rooms" icon={Network} />
          <LabMode label="Hardware assembly" icon={Wrench} />
        </div>
      </div>

      {activeProject ? (
        <div className="grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="rounded-lg border border-border bg-card p-3 shadow-sm">
            <div className="mb-3 px-2 text-xs font-semibold">Prototype queue</div>
            <div className="space-y-2">
              {projects.slice(0, 8).map((project, index) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className={`block rounded-md border p-3 text-xs transition-colors ${
                    index === 0 ? "border-foreground/20 bg-background shadow-sm" : "border-transparent hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium">{project.title}</span>
                    <ArrowUpRight aria-hidden="true" className="size-3.5 text-muted-foreground" />
                  </div>
                  <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-muted-foreground">{project.summary}</p>
                </Link>
              ))}
            </div>
          </aside>

          <VisualLabWorkspace projectId={activeProject.id} />
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border bg-card p-8">
          <div className="max-w-2xl">
            <h2 className="text-base font-semibold">No prototype to build yet</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Start a prototype first. Once created, it appears here with a visual Build Lab, milestone steps, AI guidance, GitHub evidence, and repository publishing.
            </p>
            <Button asChild className="mt-5 bg-foreground text-background hover:bg-foreground/90">
              <Link href="/projects/new">
                <Plus aria-hidden="true" />
                Start prototype
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function LabMode({ label, icon: Icon }: { label: string; icon: typeof Rocket }) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-border bg-background p-3">
      <span className="grid size-8 place-items-center rounded-md bg-accent text-accent-foreground">
        <Icon aria-hidden="true" className="size-4" />
      </span>
      <span className="text-xs font-medium">{label}</span>
    </div>
  );
}
