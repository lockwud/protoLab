"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Feedback } from "@/types";

export function FeedbackPanel({
  projectId,
  feedback,
  canReview,
}: {
  projectId: string;
  feedback: (Feedback & { authorName: string })[];
  canReview: boolean;
}) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!content.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ projectId, content, rating }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to submit feedback.");
        return;
      }
      setContent("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Lecturer review &amp; feedback</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {canReview && (
          <div className="flex flex-col gap-2 rounded-md border border-border p-3">
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Leave feedback…" />
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">Rating</label>
              <select
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="rounded-md border border-input bg-transparent px-2 py-1 text-sm"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <Button size="sm" onClick={submit} disabled={loading}>
                {loading ? "Saving…" : "Submit feedback"}
              </Button>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )}

        {feedback.length === 0 && <p className="text-sm text-muted-foreground">No feedback yet.</p>}
        {feedback.map((f) => (
          <div key={f.id} className="rounded-md border border-border p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{f.authorName}</span>
              {f.rating && <span className="font-mono text-xs text-muted-foreground">{f.rating}/5</span>}
            </div>
            <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{f.content}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
