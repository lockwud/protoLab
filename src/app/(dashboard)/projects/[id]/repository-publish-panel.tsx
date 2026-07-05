"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function RepositoryPublishPanel({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [tags, setTags] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [published, setPublished] = useState(false);

  async function publish() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/repository", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ projectId, tags: tags.split(",").map((t) => t.trim()).filter(Boolean) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to publish.");
        return;
      }
      setPublished(true);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Publish to Innovation Repository</CardTitle>
        <CardDescription>Share this prototype with the wider ProtoLab community.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="fintech, mobile, ai (comma separated)" />
        <Button size="sm" onClick={publish} disabled={loading} className="self-start">
          {loading ? "Publishing…" : published ? "Published ✓" : "Publish"}
        </Button>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
