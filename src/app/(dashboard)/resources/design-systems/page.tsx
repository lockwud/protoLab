import Link from "next/link";
import { ArrowUpRight, Component, LayoutGrid, Palette, PanelTop, Type } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const SYSTEMS = [
  { title: "Dashboard surfaces", icon: LayoutGrid, detail: "Dense cards, KPI dials, review panels, task boards, and status badges." },
  { title: "Prototype screens", icon: PanelTop, detail: "Forms, app flows, web pages, service diagrams, and submission-ready screen sets." },
  { title: "Typography", icon: Type, detail: "Display headings for page titles, compact mono labels for status and institutional metadata." },
  { title: "Component controls", icon: Component, detail: "Buttons, tabs, segmented controls, progress bars, badges, and evidence cards." },
];

export default async function DesignSystemsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  return (
    <div className="mx-auto max-w-7xl">
      <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Prototype UI resources</p>
            <h1 className="font-display mt-1 text-3xl font-semibold">Design Systems</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Shared interface patterns for student prototypes, lecturer review surfaces, and institutional repository pages.
            </p>
          </div>
          <Badge variant="outline">ProtoLab visual language</Badge>
        </div>
      </section>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {SYSTEMS.map((system) => {
          const Icon = system.icon;
          return (
            <section key={system.title} className="rounded-lg border border-border bg-card p-5 shadow-sm">
              <span className="grid size-9 place-items-center rounded-md bg-secondary text-secondary-foreground">
                <Icon aria-hidden="true" className="size-4" />
              </span>
              <h2 className="mt-4 text-sm font-semibold">{system.title}</h2>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">{system.detail}</p>
            </section>
          );
        })}
      </div>

      <section className="mt-5 rounded-lg border border-border bg-card p-5 shadow-sm">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div>
            <h2 className="text-sm font-semibold">Current palette</h2>
            <p className="mt-1 text-xs text-muted-foreground">A quiet institutional base with high-signal accents for active build state.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-4">
              <Swatch name="Paper" className="bg-background" />
              <Swatch name="Ink" className="bg-foreground" dark />
              <Swatch name="Signal" className="bg-accent" />
              <Swatch name="Amber" className="bg-[var(--amber)]" />
            </div>
          </div>
          <div className="rounded-md border border-border bg-background p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Palette aria-hidden="true" className="size-4 text-muted-foreground" />
              Usage rule
            </div>
            <p className="text-xs leading-5 text-muted-foreground">
              Keep student work pages compact and scannable. Use Build Lab for doing work, Repository for archived outcomes, and dashboards for review momentum.
            </p>
            <Button asChild size="sm" variant="outline" className="mt-4 h-8 text-[11px]">
              <Link href="/projects/new">
                Start with a prototype
                <ArrowUpRight aria-hidden="true" className="size-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function Swatch({ name, className, dark = false }: { name: string; className: string; dark?: boolean }) {
  return (
    <div className="overflow-hidden rounded-md border border-border bg-card">
      <div className={`h-16 ${className}`} />
      <div className={`px-3 py-2 text-xs font-medium ${dark ? "text-foreground" : ""}`}>{name}</div>
    </div>
  );
}
