import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { listAllProjects, listProjectsForOwner } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function ProjectsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const projects: Array<{ id: string; title: string; summary: string; status: string; ownerName?: string }> =
    user.role === "STUDENT"
      ? (await listProjectsForOwner(user.id)).map((p) => ({ ...p, ownerName: undefined }))
      : await listAllProjects();

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Modules 04–07</p>
          <h1 className="font-display mt-1 text-3xl font-semibold">Prototypes</h1>
        </div>
        {user.role === "STUDENT" && (
          <Button asChild size="sm">
            <Link href="/projects/new">+ New prototype</Link>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {projects.length === 0 && (
          <p className="col-span-2 rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground">
            No prototypes yet.
          </p>
        )}
        {projects.map((p) => (
          <Link key={p.id} href={`/projects/${p.id}`}>
            <Card className="h-full transition-colors hover:bg-muted">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  {p.title}
                  <Badge>{p.status}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-2 text-sm text-muted-foreground">{p.summary}</p>
                {p.ownerName && <p className="mt-2 text-xs text-muted-foreground">by {p.ownerName}</p>}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
