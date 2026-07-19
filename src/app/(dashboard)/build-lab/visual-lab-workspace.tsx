"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, CheckCircle2, Code2, Link2, Loader2, Trash2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ComponentInventory, LabConnection, LabNode, LabSimulation, LabValidation, LabWorkspace } from "@/types";

type LabPayload = {
  workspace: LabWorkspace;
  components: ComponentInventory[];
  nodes: LabNode[];
  connections: LabConnection[];
  validation: LabValidation | null;
  simulation: LabSimulation | null;
};

type FirmwareDemo = {
  mode: "blink" | "beep";
  board: string;
  pin: number;
  sketch: string;
};

export function VisualLabWorkspace({ projectId }: { projectId: string }) {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [payload, setPayload] = useState<LabPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const [validating, setValidating] = useState(false);
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    load();
    async function load() {
      setLoading(true);
      const res = await fetch(`/api/lab?projectId=${projectId}`);
      const data = await res.json();
      if (res.ok) setPayload(data);
      setLoading(false);
    }
  }, [projectId]);

  const groupedComponents = useMemo(() => {
    const groups = new Map<string, ComponentInventory[]>();
    for (const component of payload?.components ?? []) {
      groups.set(component.category, [...(groups.get(component.category) ?? []), component]);
    }
    return [...groups.entries()];
  }, [payload?.components]);

  const firmware = readFirmwareDemo(payload?.simulation?.metrics);

  async function addNode(component: ComponentInventory) {
    if (!payload) return;
    const size = component.kind === "ui_block" ? componentSize(component.metadata) : null;
    const res = await fetch("/api/lab", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "node",
        workspaceId: payload.workspace.id,
        componentId: component.id,
        label: component.name,
        type: component.kind,
        x: component.kind === "ui_block" ? 160 + (payload.nodes.length % 3) * 32 : 90 + payload.nodes.length * 28,
        y: component.kind === "ui_block" ? 80 + (payload.nodes.length % 5) * 42 : 90 + payload.nodes.length * 18,
        config: size ? { ...component.metadata, ...size } : component.metadata,
      }),
    });
    const data = await res.json();
    if (res.ok) setPayload({ ...payload, nodes: [...payload.nodes, data.node] });
  }

  function startDrag(event: React.PointerEvent<HTMLDivElement>, node: LabNode) {
    const rect = event.currentTarget.getBoundingClientRect();
    setDragging({ id: node.id, offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top });
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragging || !payload || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const node = payload.nodes.find((item) => item.id === dragging.id);
    const size = node ? nodeSize(node) : { width: 144, height: 72 };
    const nextX = Math.max(8, Math.min(rect.width - size.width - 8, event.clientX - rect.left - dragging.offsetX));
    const nextY = Math.max(8, Math.min(rect.height - size.height - 8, event.clientY - rect.top - dragging.offsetY));
    setPayload({
      ...payload,
      nodes: payload.nodes.map((node) => (node.id === dragging.id ? { ...node, x: nextX, y: nextY } : node)),
    });
  }

  async function endDrag() {
    if (!dragging || !payload) return;
    const node = payload.nodes.find((item) => item.id === dragging.id);
    setDragging(null);
    if (!node) return;
    await fetch(`/api/lab/nodes/${node.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ x: node.x, y: node.y }),
    });
  }

  async function selectNode(nodeId: string) {
    if (!payload) return;
    if (!selectedSource) {
      setSelectedSource(nodeId);
      return;
    }
    if (selectedSource === nodeId) {
      setSelectedSource(null);
      return;
    }

    const exists = payload.connections.some(
      (connection) =>
        (connection.sourceNodeId === selectedSource && connection.targetNodeId === nodeId) ||
        (connection.sourceNodeId === nodeId && connection.targetNodeId === selectedSource)
    );
    if (!exists) {
      const res = await fetch("/api/lab", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "connection",
          workspaceId: payload.workspace.id,
          sourceNodeId: selectedSource,
          targetNodeId: nodeId,
          connectionType: "link",
        }),
      });
      const data = await res.json();
      if (res.ok) setPayload({ ...payload, connections: [...payload.connections, data.connection] });
    }
    setSelectedSource(null);
  }

  async function deleteNode(nodeId: string) {
    if (!payload) return;
    const res = await fetch(`/api/lab/nodes/${nodeId}`, { method: "DELETE" });
    if (!res.ok) return;
    setPayload({
      ...payload,
      nodes: payload.nodes.filter((node) => node.id !== nodeId),
      connections: payload.connections.filter((connection) => connection.sourceNodeId !== nodeId && connection.targetNodeId !== nodeId),
      validation: null,
      simulation: null,
    });
  }

  async function validate() {
    if (!payload) return;
    setValidating(true);
    const res = await fetch("/api/lab/validate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ workspaceId: payload.workspace.id }),
    });
    const data = await res.json();
    if (res.ok) setPayload({ ...payload, validation: data.validation });
    setValidating(false);
  }

  async function simulate() {
    if (!payload) return;
    setSimulating(true);
    const res = await fetch("/api/lab/simulate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ workspaceId: payload.workspace.id }),
    });
    const data = await res.json();
    if (res.ok) setPayload({ ...payload, simulation: data.simulation });
    setSimulating(false);
  }

  if (loading) {
    return (
      <div className="grid min-h-[32rem] place-items-center rounded-lg border border-border bg-card">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          Loading Build Lab...
        </div>
      </div>
    );
  }

  if (!payload) {
    return <div className="rounded-lg border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">Build Lab could not load.</div>;
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)_300px]">
      <aside className="rounded-lg border border-border bg-card p-3 shadow-sm">
        <div className="mb-3 px-2 text-xs font-semibold">Component inventory</div>
        <div className="space-y-4">
          {groupedComponents.map(([category, components]) => (
            <div key={category}>
              <div className="mb-2 px-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{category}</div>
              <div className="space-y-1">
                {components.map((component) => (
                  <button
                    key={component.id}
                    type="button"
                    className="w-full rounded-md border border-transparent px-2 py-2 text-left text-xs transition-colors hover:border-border hover:bg-background"
                    onClick={() => addNode(component)}
                  >
                    <div className="font-medium">{component.name}</div>
                    <div className="line-clamp-1 text-[10px] text-muted-foreground">{component.description}</div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </aside>

      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-3">
          <div>
            <div className="text-sm font-semibold">{payload.workspace.title}</div>
            <div className="text-[11px] text-muted-foreground">Drag components. Click one node, then another to create a connection.</div>
          </div>
          <div className="flex items-center gap-2">
            {selectedSource && <Badge variant="outline">Link mode</Badge>}
            <Button size="sm" variant="outline" className="h-8 text-[11px]" onClick={validate} disabled={validating}>
              {validating ? <Loader2 aria-hidden="true" className="size-3.5 animate-spin" /> : <Zap aria-hidden="true" className="size-3.5" />}
              Validate
            </Button>
            <Button size="sm" className="h-8 text-[11px]" onClick={simulate} disabled={simulating}>
              {simulating ? <Loader2 aria-hidden="true" className="size-3.5 animate-spin" /> : <Bot aria-hidden="true" className="size-3.5" />}
              Simulate
            </Button>
          </div>
        </div>

        <div
          ref={canvasRef}
          className="relative h-[34rem] overflow-hidden bg-background"
          onPointerMove={moveDrag}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <div className="absolute inset-0 bg-[linear-gradient(var(--border)_1px,transparent_1px),linear-gradient(90deg,var(--border)_1px,transparent_1px)] bg-[size:30px_30px] opacity-50" />
          <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
            {payload.connections.map((connection) => {
              const source = payload.nodes.find((node) => node.id === connection.sourceNodeId);
              const target = payload.nodes.find((node) => node.id === connection.targetNodeId);
              if (!source || !target) return null;
              return (
                <line
                  key={connection.id}
                  x1={source.x + 70}
                  y1={source.y + 34}
                  x2={target.x + 70}
                  y2={target.y + 34}
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray="7 6"
                  className="text-foreground/50"
                />
              );
            })}
          </svg>

          {payload.nodes.length === 0 && (
            <div className="absolute inset-6 grid place-items-center rounded-md border border-dashed border-border bg-card/70">
              <div className="max-w-sm text-center">
                <Bot aria-hidden="true" className="mx-auto size-8 text-muted-foreground" />
                <div className="mt-3 text-sm font-semibold">Start assembling</div>
                <p className="mt-1 text-xs text-muted-foreground">Choose components from the inventory to build a saved visual lab.</p>
              </div>
            </div>
          )}

          {payload.nodes.some((node) => node.type === "screen" || node.type === "ui_block") && (
            <div className="absolute inset-5 rounded-xl border border-foreground/10 bg-gradient-to-br from-card via-background to-muted/40 shadow-inner">
              <div className="flex h-9 items-center gap-2 border-b border-border px-4">
                <span className="size-2.5 rounded-full bg-destructive/70" />
                <span className="size-2.5 rounded-full bg-[var(--amber)]" />
                <span className="size-2.5 rounded-full bg-accent" />
                <span className="ml-3 rounded bg-muted px-3 py-1 font-mono text-[10px] text-muted-foreground">/prototype-preview</span>
              </div>
              <div className="pointer-events-none absolute bottom-3 right-4 rounded-full border border-border bg-card px-3 py-1 text-[10px] text-muted-foreground shadow-sm">
                Drag web UI blocks to design the screen
              </div>
            </div>
          )}

          {payload.nodes.map((node) => (
            <div
              key={node.id}
              role="button"
              tabIndex={0}
              className={`absolute z-10 rounded-md border bg-card p-3 text-left shadow-sm transition-shadow hover:shadow-md ${
                selectedSource === node.id ? "border-accent" : "border-border"
              }`}
              style={{ left: node.x, top: node.y, width: nodeSize(node).width, minHeight: nodeSize(node).height }}
              onPointerDown={(event) => startDrag(event, node)}
              onDoubleClick={() => selectNode(node.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") selectNode(node.id);
              }}
            >
              {node.type === "ui_block" ? <WebBlockPreview node={node} /> : <DefaultNodePreview node={node} />}
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">dbl-click link</span>
                <button
                  type="button"
                  className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label={`Remove ${node.label}`}
                  onPointerDown={(event) => {
                    event.stopPropagation();
                  }}
                  onClick={(event) => {
                    event.stopPropagation();
                    deleteNode(node.id);
                  }}
                >
                  <Trash2 aria-hidden="true" className="size-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <aside className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">Lab engine</div>
            <div className="text-[11px] text-muted-foreground">Validation and simulation traces</div>
          </div>
          <Badge variant={payload.simulation?.status === "PASS" ? "default" : "outline"}>
            {payload.simulation?.status ?? payload.validation?.status ?? "Not run"}
          </Badge>
        </div>
        <div className="space-y-4">
          {firmware && (
            <div className="overflow-hidden rounded-lg border border-foreground/10 bg-foreground text-background shadow-sm">
              <div className="flex items-start justify-between gap-3 p-4">
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Code2 aria-hidden="true" className="size-4" />
                    Arduino {firmware.mode === "beep" ? "beep" : "blink"} demo
                  </div>
                  <p className="mt-1 text-xs leading-5 text-background/70">
                    Upload to {firmware.board}. Uses pin {firmware.pin} for the connected {firmware.mode === "beep" ? "buzzer" : "LED"} output.
                  </p>
                </div>
                <Badge className="border-background/20 bg-background text-foreground hover:bg-background">Ready</Badge>
              </div>
              <pre className="max-h-72 overflow-auto border-t border-background/15 bg-black/25 p-4 text-[11px] leading-5 text-background">
                <code>{firmware.sketch}</code>
              </pre>
            </div>
          )}

          <div>
            <div className="mb-2 text-xs font-semibold">Simulation</div>
            {!payload.simulation && (
              <p className="rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
                Run simulation to test reachability, circuit signal paths, power estimate, and software data flow.
              </p>
            )}
            {payload.simulation && (
              <div className="space-y-2">
                <p className="rounded-md border border-border bg-background p-3 text-xs leading-5 text-muted-foreground">
                  {payload.simulation.summary}
                </p>
                {payload.simulation.traces.map((trace, index) => (
                  <div key={`${trace.title}-${index}`} className="rounded-md border border-border p-3">
                    <div className="flex items-start gap-2">
                      <span
                        className={`mt-1 size-2 rounded-full ${
                          trace.status === "fail"
                            ? "bg-destructive"
                            : trace.status === "warn"
                              ? "bg-amber-500"
                              : "bg-accent"
                        }`}
                      />
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-semibold">{trace.title}</span>
                          <span className="font-mono text-[10px] uppercase text-muted-foreground">{trace.type}</span>
                        </div>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">{trace.detail}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="mb-2 text-xs font-semibold">Validation</div>
          {!payload.validation && (
            <p className="rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
              Run validation to check missing connections, networking structure, and circuit/controller requirements.
            </p>
          )}
          {payload.validation?.issues.map((issue, index) => (
            <div key={`${issue.message}-${index}`} className="rounded-md border border-border p-3">
              <div className="flex items-start gap-2">
                <CheckCircle2 aria-hidden="true" className="mt-0.5 size-3.5 text-accent-foreground" />
                <div>
                  <div className="font-mono text-[10px] uppercase text-muted-foreground">{issue.severity}</div>
                  <p className="mt-1 text-xs leading-5">{issue.message}</p>
                </div>
              </div>
            </div>
          ))}
          </div>
        </div>
      </aside>
    </div>
  );
}

function DefaultNodePreview({ node }: { node: LabNode }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div>
        <div className="text-xs font-semibold">{node.label}</div>
        <div className="font-mono text-[10px] uppercase text-muted-foreground">{node.type}</div>
      </div>
      <span className="grid size-6 place-items-center rounded bg-secondary text-secondary-foreground">
        <Link2 aria-hidden="true" className="size-3" />
      </span>
    </div>
  );
}

function WebBlockPreview({ node }: { node: LabNode }) {
  const variant = typeof node.config.variant === "string" ? node.config.variant : "card";
  if (variant === "nav") {
    return (
      <div className="rounded-md border border-sky-200 bg-gradient-to-r from-sky-500 to-indigo-600 p-3 text-white shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="font-display text-sm font-semibold">ProtoLab</div>
          <div className="flex gap-2 text-[10px] text-white/80"><span>Work</span><span>Review</span><span>Ship</span></div>
        </div>
      </div>
    );
  }
  if (variant === "hero") {
    return (
      <div className="rounded-lg bg-[radial-gradient(circle_at_top_left,#d9ff66,transparent_38%),linear-gradient(135deg,#171717,#4f46e5)] p-4 text-white shadow-sm">
        <div className="max-w-xs font-display text-xl font-semibold">Build a working prototype</div>
        <p className="mt-2 max-w-sm text-[11px] leading-4 text-white/75">Design the web screen, connect APIs, and prepare review evidence.</p>
        <div className="mt-4 h-7 w-28 rounded-full bg-lime-300 shadow-[0_0_24px_rgba(217,255,102,0.45)]" />
      </div>
    );
  }
  if (variant === "form") {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
        <div className="mb-3 text-xs font-semibold text-emerald-950">Intake form</div>
        <div className="space-y-2"><div className="h-8 rounded border border-emerald-200 bg-white" /><div className="h-8 rounded border border-emerald-200 bg-white" /><div className="h-8 w-24 rounded bg-emerald-500" /></div>
      </div>
    );
  }
  if (variant === "button") {
    return <div className="grid h-9 place-items-center rounded-full bg-gradient-to-r from-fuchsia-500 to-orange-400 px-4 text-xs font-semibold text-white shadow-[0_12px_28px_rgba(217,70,239,0.28)]">Primary action</div>;
  }
  return (
    <div className="rounded-lg border border-violet-200 bg-gradient-to-br from-violet-50 to-pink-50 p-4 shadow-sm">
      <div className="text-xs font-semibold text-violet-950">{node.label}</div>
      <div className="mt-4 h-8 w-16 rounded bg-violet-500" />
      <div className="mt-3 space-y-2"><div className="h-2 rounded bg-violet-200" /><div className="h-2 w-2/3 rounded bg-pink-200" /></div>
    </div>
  );
}

function componentSize(metadata: Record<string, unknown>) {
  const width = typeof metadata.width === "number" ? metadata.width : 240;
  const height = typeof metadata.height === "number" ? metadata.height : 110;
  return { width, height };
}

function nodeSize(node: LabNode) {
  if (node.type !== "ui_block") return { width: 144, height: 72 };
  return componentSize(node.config);
}

function readFirmwareDemo(metrics: Record<string, unknown> | undefined): FirmwareDemo | null {
  const firmware = metrics?.firmware;
  if (!firmware || typeof firmware !== "object") return null;
  const value = firmware as Partial<FirmwareDemo>;
  if ((value.mode !== "blink" && value.mode !== "beep") || typeof value.board !== "string") return null;
  if (typeof value.pin !== "number" || typeof value.sketch !== "string") return null;
  return { mode: value.mode, board: value.board, pin: value.pin, sketch: value.sketch };
}
