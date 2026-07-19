import Link from "next/link";
import { ArrowUpRight, Box, CircuitBoard, Cpu, Network, Package, PlugZap } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { listComponentInventory } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const ICONS: Record<string, typeof Package> = {
  electronics: CircuitBoard,
  networking: Network,
  software: Cpu,
};

export default async function CircuitPartsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const components = await listComponentInventory();
  const grouped = components.reduce<Record<string, typeof components>>((acc, component) => {
    acc[component.category] = [...(acc[component.category] ?? []), component];
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-7xl">
      <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Build inventory</p>
            <h1 className="font-display mt-1 text-3xl font-semibold">Circuit Parts</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Components available to the Build Lab for networking, Arduino/IoT, software flow, and hardware prototype planning.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{components.length} components</Badge>
            <Badge variant="outline">{Object.keys(grouped).length} categories</Badge>
          </div>
        </div>
      </section>

      <div className="mt-5 grid gap-5">
        {Object.entries(grouped).map(([category, items]) => {
          const Icon = ICONS[category] ?? Box;
          return (
            <section key={category} className="rounded-lg border border-border bg-card shadow-sm">
              <div className="flex items-center justify-between gap-4 border-b border-border p-5">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-md bg-secondary text-secondary-foreground">
                    <Icon aria-hidden="true" className="size-4" />
                  </span>
                  <div>
                    <h2 className="text-sm font-semibold">{formatLabel(category)}</h2>
                    <p className="text-[11px] text-muted-foreground">Available for visual assembly and simulation checks.</p>
                  </div>
                </div>
                <Badge variant="outline">{items.length}</Badge>
              </div>
              <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-3">
                {items.map((component) => (
                  <div key={component.id} className="rounded-md border border-border bg-background p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold">{component.name}</h3>
                        <p className="mt-1 font-mono text-[10px] uppercase text-muted-foreground">{component.kind}</p>
                      </div>
                      <PlugZap aria-hidden="true" className="size-4 text-muted-foreground" />
                    </div>
                    <p className="mt-3 text-xs leading-5 text-muted-foreground">{component.description}</p>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {Object.entries(component.metadata ?? {}).slice(0, 3).map(([key, value]) => (
                        <Badge key={key} variant="outline" className="font-mono text-[10px]">
                          {key}: {String(value)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <div className="mt-5 flex justify-end">
        <Button asChild className="h-8 bg-foreground text-[11px] text-background hover:bg-foreground/90">
          <Link href="/build-lab">
            Open Build Lab
            <ArrowUpRight aria-hidden="true" className="size-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

function formatLabel(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}
