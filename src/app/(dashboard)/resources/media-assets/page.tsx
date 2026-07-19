import Link from "next/link";
import { FileImage, FolderOpen, ImagePlus, UploadCloud } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { query } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function MediaAssetsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const documents = await query<{ type: string; count: string }>(
    `SELECT type, count(*) FROM "Document" GROUP BY type ORDER BY type ASC`
  );
  const total = documents.reduce((sum, row) => sum + Number(row.count), 0);

  return (
    <div className="mx-auto max-w-7xl">
      <ResourceHero
        eyebrow="Resource library"
        title="Media Assets"
        description="Organize prototype images, wiring photos, screenshots, diagrams, and review attachments used across project evidence."
        icon={FileImage}
        badges={[`${total} saved docs`, "Evidence ready"]}
      />

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="rounded-lg border border-border bg-card shadow-sm">
          <div className="border-b border-border p-5">
            <h2 className="text-sm font-semibold">Asset lanes</h2>
            <p className="mt-1 text-xs text-muted-foreground">Use these lanes to keep build evidence easy to review.</p>
          </div>
          <div className="grid gap-3 p-5 md:grid-cols-2">
            <AssetLane title="Prototype screenshots" detail="UI states, mobile screens, dashboard captures, and user flow frames." />
            <AssetLane title="Lab evidence" detail="Circuit photos, cable termination shots, room layouts, and device placement." />
            <AssetLane title="Diagrams" detail="Network topology, architecture drawings, wiring sketches, and build maps." />
            <AssetLane title="Review attachments" detail="Lecturer comments, marked evidence, revision notes, and final portfolio media." />
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-md bg-secondary text-secondary-foreground">
                <UploadCloud aria-hidden="true" className="size-4" />
              </span>
              <div>
                <h2 className="text-sm font-semibold">Upload path</h2>
                <p className="text-[11px] text-muted-foreground">Attach assets from prototype workspaces.</p>
              </div>
            </div>
            <p className="mt-4 text-xs leading-5 text-muted-foreground">
              Open a prototype, use milestones, feedback, AI documents, or repository publishing to keep files connected to the correct build.
            </p>
            <Button asChild size="sm" className="mt-4 h-8 bg-foreground text-[11px] text-background hover:bg-foreground/90">
              <Link href="/projects">
                <FolderOpen aria-hidden="true" className="size-3.5" />
                Open prototypes
              </Link>
            </Button>
          </section>

          <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <h2 className="text-sm font-semibold">Saved document types</h2>
            <div className="mt-3 space-y-2">
              {documents.length === 0 && <p className="rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">No generated documents yet.</p>}
              {documents.map((row) => (
                <div key={row.type} className="flex items-center justify-between rounded-md border border-border bg-background p-3 text-xs">
                  <span className="font-medium">{formatLabel(row.type)}</span>
                  <Badge variant="outline">{row.count}</Badge>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function AssetLane({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-md border border-border bg-background p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <ImagePlus aria-hidden="true" className="size-4 text-muted-foreground" />
        {title}
      </div>
      <p className="text-xs leading-5 text-muted-foreground">{detail}</p>
    </div>
  );
}

function ResourceHero({
  eyebrow,
  title,
  description,
  icon: Icon,
  badges,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: typeof FileImage;
  badges: string[];
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{eyebrow}</p>
          <h1 className="font-display mt-1 text-3xl font-semibold">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="grid size-10 place-items-center rounded-md bg-accent text-accent-foreground">
            <Icon aria-hidden="true" className="size-5" />
          </span>
          {badges.map((badge) => <Badge key={badge} variant="outline">{badge}</Badge>)}
        </div>
      </div>
    </section>
  );
}

function formatLabel(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}
