import Link from "next/link";
import { ArrowUpRight, CircuitBoard, Code2, HardDriveUpload, Network, Wrench } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const TEMPLATES = [
  {
    title: "Web prototype",
    href: "/projects/new",
    icon: Code2,
    detail: "Screens, API flow, data model, GitHub evidence, and usability review.",
    steps: ["Plan screens", "Link service", "Validate data flow"],
  },
  {
    title: "Arduino / IoT",
    href: "/projects/new",
    icon: CircuitBoard,
    detail: "Controller, sensors, output modules, power estimate, and wiring simulation.",
    steps: ["Place board", "Wire inputs", "Simulate load"],
  },
  {
    title: "Networking lab",
    href: "/projects/new",
    icon: Network,
    detail: "Rooms, endpoints, switches, router backbone, cable paths, and reachability traces.",
    steps: ["Map rooms", "Run cable", "Test reachability"],
  },
  {
    title: "Hardware assembly",
    href: "/projects/new",
    icon: Wrench,
    detail: "Parts, assembly order, safety checks, evidence capture, and lecturer supervision.",
    steps: ["List parts", "Sequence build", "Attach evidence"],
  },
];

export default async function LabTemplatesPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  return (
    <div className="mx-auto max-w-7xl">
      <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Reusable build starts</p>
            <h1 className="font-display mt-1 text-3xl font-semibold">Lab Templates</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Starter structures for prototype work across software, IoT, Arduino, networking, and hardware assembly courses.
            </p>
          </div>
          <Button asChild className="h-8 bg-foreground text-[11px] text-background hover:bg-foreground/90">
            <Link href="/projects/new">
              Use template
              <ArrowUpRight aria-hidden="true" className="size-3.5" />
            </Link>
          </Button>
        </div>
      </section>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {TEMPLATES.map((template) => {
          const Icon = template.icon;
          return (
            <Link key={template.title} href={template.href} className="group rounded-lg border border-border bg-card p-5 shadow-sm transition-colors hover:bg-muted/45">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="grid size-10 place-items-center rounded-md bg-secondary text-secondary-foreground">
                    <Icon aria-hidden="true" className="size-5" />
                  </span>
                  <div>
                    <h2 className="text-sm font-semibold">{template.title}</h2>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{template.detail}</p>
                  </div>
                </div>
                <ArrowUpRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground group-hover:text-foreground" />
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {template.steps.map((step) => <Badge key={step} variant="outline">{step}</Badge>)}
              </div>
            </Link>
          );
        })}
      </div>

      <section className="mt-5 rounded-lg border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-md bg-accent text-accent-foreground">
            <HardDriveUpload aria-hidden="true" className="size-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold">Department-ready setup</h2>
            <p className="text-xs text-muted-foreground">
              Templates stay generic so more engineering and technology departments can adopt the same workflow later.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
