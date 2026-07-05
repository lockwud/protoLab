"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function GradeForm({ submissionId }: { submissionId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [grade, setGrade] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!open) {
    return (
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        Give feedback &amp; grade
      </Button>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          submissionId,
          content,
          grade: grade ? Number(grade) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to save feedback.");
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2">
      <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Feedback…" required />
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={0}
          max={100}
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
          placeholder="Grade /100"
          className="w-32"
        />
        <Button size="sm" type="submit" disabled={loading}>
          {loading ? "Saving…" : "Save"}
        </Button>
        <Button size="sm" type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  );
}
