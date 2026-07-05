import Link from "next/link";
import { query } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const entries = await query<RepoRow>(
    `SELECT r.*, p.title, p.summary, u.name as "authorName"
     FROM "InnovationRepository" r
     JOIN "Project" p ON p.id = r."projectId"
     JOIN "User" u ON u.id = r."authorId"
     ORDER BY r."publishedAt" DESC`
  );

  return (
    <div className="mx-auto max-w-4xl">
      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Module 10</p>
      <h1 className="font-display mt-1 text-3xl font-semibold">Innovation Repository</h1>
      <p className="mt-2 text-muted-foreground">Published prototypes from across ProtoLab.</p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {entries.length === 0 && (
          <p className="col-span-2 rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground">
            Nothing published yet. Publish a prototype from its Settings tab to feature it here.
          </p>
        )}
        {entries.map((e) => (
          <Link key={e.id} href={`/projects/${e.projectId}`}>
            <Card className="h-full transition-colors hover:bg-muted">
              <CardHeader>
                <CardTitle className="text-base">{e.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-2 text-sm text-muted-foreground">{e.summary}</p>
                <p className="mt-2 text-xs text-muted-foreground">by {e.authorName}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {(e.tags ?? []).map((t) => (
                    <Badge key={t} variant="outline">
                      {t}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
