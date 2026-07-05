"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Milestone, MilestoneStatus } from "@/types";
import { cn } from "@/lib/utils";

const STATUS_ORDER: MilestoneStatus[] = ["PENDING", "IN_PROGRESS", "DONE", "BLOCKED"];
const STATUS_LABEL: Record<MilestoneStatus, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In progress",
  DONE: "Done",
  BLOCKED: "Blocked",
};

export function MilestoneBoard({
  projectId,
  milestones,
  canEdit,
}: {
  projectId: string;
  milestones: Milestone[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [newTitle, setNewTitle] = useState("");
  const [loading, setLoading] = useState(false);

  async function updateStatus(id: string, status: MilestoneStatus) {
    await fetch(`/api/milestones/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  async function addMilestone() {
    if (!newTitle.trim()) return;
    setLoading(true);
    try {
      await fetch("/api/milestones", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ projectId, title: newTitle, order: milestones.length }),
      });
      setNewTitle("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const done = milestones.filter((m) => m.status === "DONE").length;
  const progress = milestones.length ? Math.round((done / milestones.length) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          Milestone tracking
          <span className="font-mono text-xs text-muted-foreground">{progress}% complete</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-accent" style={{ width: `${progress}%` }} />
        </div>

        {milestones.map((m) => (
          <div key={m.id} className="flex items-center justify-between rounded-md border border-border p-3">
            <div>
              <div className={cn("font-medium", m.status === "DONE" && "line-through text-muted-foreground")}>
                {m.title}
              </div>
              {m.description && <div className="text-sm text-muted-foreground">{m.description}</div>}
            </div>
            {canEdit ? (
              <div className="flex gap-1">
                {STATUS_ORDER.map((s) => (
                  <button
                    key={s}
                    onClick={() => updateStatus(m.id, s)}
                    className={cn(
                      "rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase transition-colors",
                      m.status === s ? "bg-primary text-primary-foreground border-transparent" : "hover:bg-muted"
                    )}
                  >
                    {STATUS_LABEL[s]}
                  </button>
                ))}
              </div>
            ) : (
              <Badge variant="outline">{STATUS_LABEL[m.status]}</Badge>
            )}
          </div>
        ))}

        {canEdit && (
          <div className="mt-2 flex gap-2">
            <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Add a milestone…" />
            <Button size="sm" onClick={addMilestone} disabled={loading}>
              Add
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
