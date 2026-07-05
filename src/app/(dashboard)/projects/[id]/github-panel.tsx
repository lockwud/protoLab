"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Project } from "@/types";

export function GithubPanel({ project, canEdit }: { project: Project; canEdit: boolean }) {
  const router = useRouter();
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [repoUrl, setRepoUrl] = useState(project.githubRepoUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/github/status")
      .then((r) => r.json())
      .then((d) => setEnabled(Boolean(d.enabled)))
      .catch(() => setEnabled(false));
  }, []);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ githubRepoUrl: repoUrl || "" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to save.");
        return;
      }
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">GitHub integration</CardTitle>
        <CardDescription>Link this prototype to its repository.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {enabled === false && (
          <p className="rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground">
            GitHub integration is disabled because no GITHUB_TOKEN is configured. You can still link a repo URL
            manually below — live repo status will appear once a token is added.
          </p>
        )}
        {canEdit ? (
          <div className="flex gap-2">
            <Input
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/username/repo"
            />
            <Button size="sm" onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        ) : project.githubRepoUrl ? (
          <a href={project.githubRepoUrl} target="_blank" rel="noreferrer" className="text-primary underline">
            {project.githubRepoUrl}
          </a>
        ) : (
          <p className="text-sm text-muted-foreground">No repository linked yet.</p>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
