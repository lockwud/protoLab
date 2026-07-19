import { CircuitBoard, Code2, Network, Wrench } from "lucide-react";
import type { Milestone, Project } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VisualLabWorkspace } from "@/app/(dashboard)/build-lab/visual-lab-workspace";

const BUILD_MODES = [
  { label: "Web page prototype", icon: Code2, detail: "Screens, flows, forms, and UI logic" },
  { label: "Arduino / IoT rig", icon: CircuitBoard, detail: "Sensors, boards, wiring, and firmware plan" },
  { label: "Networking lab", icon: Network, detail: "Rooms, cable runs, devices, IP plan, validation" },
  { label: "Hardware assembly", icon: Wrench, detail: "Parts, safety checks, build sequence" },
];

export function BuildLabPanel({ project, milestones }: { project: Project; milestones: Milestone[] }) {
  const activeMilestones = milestones.filter((milestone) => milestone.status !== "DONE").slice(0, 4);

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Build Lab</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Assemble, save, and validate the working prototype before submission or repository publishing.
            </p>
          </div>
          <Badge>{formatStatus(project.status)}</Badge>
        </div>
      </div>
      <VisualLabWorkspace projectId={project.id} />
      <div className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Build modes</CardTitle>
            <CardDescription>Choose the kind of work this prototype needs.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {BUILD_MODES.map((mode) => {
              const Icon = mode.icon;
              return (
                <div key={mode.label} className="flex items-start gap-3 rounded-md border border-border p-3">
                  <span className="grid size-8 place-items-center rounded-md bg-secondary text-secondary-foreground">
                    <Icon aria-hidden="true" className="size-4" />
                  </span>
                  <div>
                    <div className="text-xs font-medium">{mode.label}</div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">{mode.detail}</div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Next build steps</CardTitle>
            <CardDescription>Driven by your milestone backend.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {activeMilestones.length === 0 && (
              <p className="rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
                Add milestones to turn this into a guided build sequence.
              </p>
            )}
            {activeMilestones.map((milestone) => (
              <div key={milestone.id} className="rounded-md border border-border p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-medium">{milestone.title}</div>
                  <Badge variant="outline">{formatStatus(milestone.status)}</Badge>
                </div>
                {milestone.description && <p className="mt-1 text-[11px] text-muted-foreground">{milestone.description}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function formatStatus(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}
