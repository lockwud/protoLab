"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function EnrollForm() {
  const router = useRouter();
  const [courseId, setCourseId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/courses/${courseId}`, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not enroll.");
        return;
      }
      setCourseId("");
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex items-end gap-2">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Enroll by course ID</label>
        <Input value={courseId} onChange={(e) => setCourseId(e.target.value)} placeholder="crs_..." className="w-64" />
      </div>
      <Button type="submit" variant="outline" disabled={loading || !courseId}>
        {loading ? "Enrolling…" : "Enroll"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  );
}
