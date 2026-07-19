import Link from "next/link";
import { ArrowUpRight, BookOpenCheck, Bot, Cable, CheckCircle2, GitBranch, GraduationCap } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { Badge } from "@/components/ui/badge";

const GUIDES = [
  {
    title: "Create a supervised prototype",
    href: "/projects/new",
    icon: GraduationCap,
    detail: "Start a prototype, seed milestones, attach project task evidence, and prepare for lecturer review.",
  },
  {
    title: "Assemble in Build Lab",
    href: "/build-lab",
    icon: Cable,
    detail: "Place components, connect devices, save workspace state, validate structure, and run simulation traces.",
  },
  {
    title: "Use AI for planning",
    href: "/projects",
    icon: Bot,
    detail: "Generate plans, documents, component lists, and revision notes from a project workspace.",
  },
  {
    title: "Connect GitHub evidence",
    href: "/projects",
    icon: GitBranch,
    detail: "Link repositories to prototypes so code, commits, and final documentation stay reviewable.",
  },
  {
    title: "Publish to repository",
    href: "/repository",
    icon: BookOpenCheck,
    detail: "Move completed innovations into long-term institutional storage for future cohorts.",
  },
];

export default async function GuidesPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  return (
    <div className="mx-auto max-w-7xl">
      <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Workflow documentation</p>
            <h1 className="font-display mt-1 text-3xl font-semibold">Guides</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Practical operating guides for students, lecturers, and departments adopting ProtoLab.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{user.role.toLowerCase()}</Badge>
            <Badge variant="outline">Assessment-ready</Badge>
          </div>
        </div>
      </section>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {GUIDES.map((guide) => {
          const Icon = guide.icon;
          return (
            <Link key={guide.title} href={guide.href} className="group rounded-lg border border-border bg-card p-5 shadow-sm transition-colors hover:bg-muted/45">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="grid size-10 place-items-center rounded-md bg-secondary text-secondary-foreground">
                    <Icon aria-hidden="true" className="size-5" />
                  </span>
                  <div>
                    <h2 className="text-sm font-semibold">{guide.title}</h2>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{guide.detail}</p>
                  </div>
                </div>
                <ArrowUpRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground group-hover:text-foreground" />
              </div>
            </Link>
          );
        })}
      </div>

      <section className="mt-5 rounded-lg border border-border bg-card p-5 shadow-sm">
        <h2 className="text-sm font-semibold">Recommended order</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-5">
          {["Course", "Project Task", "Prototype", "Build Lab", "Repository"].map((item, index) => (
            <div key={item} className="rounded-md border border-border bg-background p-3">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold">
                <CheckCircle2 aria-hidden="true" className="size-3.5 text-accent-foreground" />
                {item}
              </div>
              <p className="font-mono text-[10px] uppercase text-muted-foreground">Step {index + 1}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
