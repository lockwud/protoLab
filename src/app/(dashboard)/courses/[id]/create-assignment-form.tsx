"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function CreateAssignmentForm({ courseId }: { courseId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="self-start">
        + New assignment
      </Button>
    );
  }

  async function createAssignment(status: "DRAFT" | "PUBLISHED") {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ courseId, title, description, dueDate: dueDate || undefined, status }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create assignment.");
        return;
      }
      setOpen(false);
      setTitle("");
      setDescription("");
      setDueDate("");
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-md border border-border p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Due date</Label>
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
        <div className="col-span-full flex flex-col gap-1.5">
          <Label>Description</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
      </div>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      <div className="mt-3 flex gap-2">
        <Button size="sm" disabled={loading || !title || !description} onClick={() => createAssignment("PUBLISHED")}>
          Publish
        </Button>
        <Button size="sm" variant="outline" disabled={loading || !title || !description} onClick={() => createAssignment("DRAFT")}>
          Save as draft
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
