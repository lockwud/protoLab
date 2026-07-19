import Link from "next/link";
import { Archive, ArrowUpRight, BookMarked, Search, Sparkles } from "lucide-react";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { listAllProjects, listProjectsForOwner } from "@/lib/data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface RepoRow {
  id: string;
  projectId: string;
  title: string;
  summary: string;
  authorName: string;
  tags: string[];
  featured: boolean;
  publishedAt: string;
}

export default async function RepositoryPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [entries, projects] = await Promise.all([
    query<RepoRow>(
      `SELECT r.id, r."projectId", r.tags, r.featured, r."publishedAt", p.title, p.summary, u.name as "authorName"
       FROM "InnovationRepository" r
       JOIN "Project" p ON p.id = r."projectId"
       JOIN "User" u ON u.id = r."authorId"
       ORDER BY r.featured DESC, r."publishedAt" DESC`
    ),
    user.role === "STUDENT" ? listProjectsForOwner(user.id) : listAllProjects(),
  ]);

  const publishedIds = new Set(entries.map((entry) => entry.projectId));
  const candidates = projects.filter((project) => !publishedIds.has(project.id)).slice(0, 4);
  const featured = entries.filter((entry) => entry.featured).length;
  const withGithub = projects.filter((project) => project.githubRepoUrl).length;

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Institutional archive</p>
              <h1 className="font-display mt-1 text-3xl font-semibold">Innovation Repository</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Long-term storage for student innovations, supervised prototypes, lab evidence, GitHub links, and reusable departmental knowledge.
              </p>
            </div>
            <div className="flex flex-col items-start gap-3 lg:items-end">
              <div className="hidden h-9 items-center gap-2 rounded-md border border-border bg-background px-3 text-xs text-muted-foreground lg:flex">
                <Search aria-hidden="true" className="size-3.5" />
                Search innovations
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="rounded-md">{entries.length} published</Badge>
                <Badge variant="outline" className="rounded-md">{featured} featured</Badge>
                <Badge variant="outline" className="rounded-md">{withGithub} GitHub linked</Badge>
              </div>
            </div>
          </div>
        </section>

        <aside className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-md bg-accent text-accent-foreground">
              <Sparkles aria-hidden="true" className="size-4" />
            </span>
            <div>
              <h2 className="text-sm font-semibold">Publishing flow</h2>
              <p className="text-[11px] text-muted-foreground">Project Settings to Repository publish</p>
            </div>
          </div>
          <p className="mt-4 text-xs leading-5 text-muted-foreground">
            Your build work happens inside a prototype. Open a project, use Build Lab, milestones, AI Assistant, GitHub, then publish from Settings.
          </p>
        </aside>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-8">
          <div className="flex max-w-2xl items-start gap-4">
            <span className="grid size-10 place-items-center rounded-md bg-secondary text-secondary-foreground">
              <Archive aria-hidden="true" className="size-5" />
            </span>
            <div>
              <h2 className="text-base font-semibold">No innovations published yet</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Publish a completed prototype from its Settings tab to make it visible here for future cohorts and departments.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {entries.map((entry) => (
            <Link key={entry.id} href={`/projects/${entry.projectId}`} className="group">
              <Card className="h-full transition-colors hover:bg-muted/45">
                <CardHeader className="flex-row items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">{entry.title}</CardTitle>
                    <CardDescription>by {entry.authorName}</CardDescription>
                  </div>
                  <ArrowUpRight aria-hidden="true" className="size-4 text-muted-foreground group-hover:text-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">{entry.summary}</p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {entry.featured && <Badge>Featured</Badge>}
                    {(entry.tags ?? []).length === 0 && <Badge variant="outline">Prototype</Badge>}
                    {(entry.tags ?? []).map((tag) => (
                      <Badge key={tag} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {candidates.length > 0 && (
        <section className="mt-5 rounded-lg border border-border bg-card p-5">
          <div className="mb-4">
            <h2 className="text-sm font-semibold">Ready to prepare</h2>
            <p className="mt-1 text-[11px] text-muted-foreground">These prototypes can be opened, completed, and published to the repository.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {candidates.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`} className="rounded-md border border-border bg-background p-3 text-sm hover:bg-muted/45">
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate font-medium">{project.title}</span>
                  <BookMarked aria-hidden="true" className="size-4 text-muted-foreground" />
                </div>
                <p className="mt-2 line-clamp-2 text-[11px] text-muted-foreground">{project.summary}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
