"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Project, Submission } from "@/types";

export function SubmissionForm({ assignmentId, existing, projects }: { assignmentId: string; existing: Submission | null; projects: Project[] }) {
  const router = useRouter();
  const [content, setContent] = useState(existing?.content ?? "");
  const [projectId, setProjectId] = useState(existing?.projectId ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/assignments/${assignmentId}/submissions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content, projectId: projectId || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to submit.");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write or link your submission here…"
        className="min-h-32"
        required
      />
      <div className="grid gap-1.5">
        <label className="text-sm font-medium">Prototype to submit for lecturer testing</label>
        <Select value={projectId} onChange={(event) => setProjectId(event.target.value)}>
          <option value="">No prototype selected</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.title}
            </option>
          ))}
        </Select>
        <p className="text-xs text-muted-foreground">Select the Build Lab prototype the lecturer should open, validate, and simulate.</p>
      </div>
      {existing && (
        <p className="text-xs text-muted-foreground">
          Status: {existing.status}
          {existing.grade !== null ? ` · Grade: ${existing.grade}/100` : ""}
        </p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={loading} className="self-start">
        {loading ? "Submitting…" : existing ? "Update submission" : "Submit"}
      </Button>
    </form>
  );
}
