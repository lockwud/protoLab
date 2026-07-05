"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Project } from "@/types";

const STATUSES = ["PLANNING", "BUILDING", "TESTING", "REVIEW", "SHIPPED"];

export function ProjectSettingsForm({ project }: { project: Project }) {
  const router = useRouter();
  const [status, setStatus] = useState(project.status);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    try {
      await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Project status</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-2">
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-48">
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <Button size="sm" onClick={save} disabled={loading}>
          {loading ? "Saving…" : "Save"}
        </Button>
      </CardContent>
    </Card>
  );
}
