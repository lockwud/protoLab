"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, Cable, CircuitBoard, Code2, Loader2, Network, Rocket, ShieldCheck, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

const TEMPLATES = [
  {
    name: "Web prototype",
    icon: Code2,
    title: "Student services web prototype",
    summary: "A usable web prototype with screens, API flow, database planning, and review evidence.",
    problem: "Students need a guided way to turn an idea into a working software prototype with feedback and GitHub evidence.",
  },
  {
    name: "Arduino / IoT",
    icon: CircuitBoard,
    title: "Smart room monitoring IoT build",
    summary: "An Arduino/IoT prototype with sensors, controller wiring, power checks, and simulation traces.",
    problem: "The build needs a safe way to test sensor wiring and controller logic before physical assembly.",
  },
  {
    name: "Networking lab",
    icon: Network,
    title: "Four-room office network lab",
    summary: "A virtual networking lab for device placement, cable runs, endpoint reachability, and topology validation.",
    problem: "A four-room office needs cable termination, switches, endpoints, and validation before the real lab installation.",
  },
  {
    name: "Hardware assembly",
    icon: Wrench,
    title: "Engineering hardware assembly plan",
    summary: "A supervised hardware prototype plan with components, safety notes, build order, and assessment evidence.",
    problem: "The team needs to assemble parts in a controlled sequence and prove the prototype is ready for review.",
  },
];

const EVIDENCE = [
  "Starter milestones are created automatically.",
  "Build Lab stores devices, circuits, cables, and software blocks.",
  "AI guidance can generate plans, documents, and validation notes.",
  "GitHub and repository publishing stay attached to the prototype.",
];

export default function NewProjectPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [problemStatement, setProblemStatement] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [planning, setPlanning] = useState(false);
  const [plan, setPlan] = useState<{ text: string; provider: string; disabledReason?: string } | null>(null);

  function applyTemplate(template: (typeof TEMPLATES)[number]) {
    setSelectedTemplate(template.name);
    setTitle(template.title);
    setSummary(template.summary);
    setProblemStatement(template.problem);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, summary, problemStatement: problemStatement || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create prototype.");
        return;
      }
      router.push(`/projects/${data.project.id}`);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function generatePlan() {
    setError(null);
    setPlan(null);
    if (!title.trim() || !summary.trim()) {
      setError("Add a title and summary before generating an AI build plan.");
      return;
    }

    setPlanning(true);
    try {
      const res = await fetch("/api/ai/plan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, summary, problemStatement: problemStatement || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to generate plan.");
        return;
      }
      setPlan({ text: data.text ?? "", provider: data.provider ?? "none", disabledReason: data.disabledReason });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setPlanning(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Prototype intake</p>
          <h1 className="font-display mt-1 text-3xl font-semibold">Start a new build</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Create a prototype workspace for software, IoT, Arduino, networking, or hardware assembly work.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">Milestones seeded</Badge>
          <Badge variant="outline">Build Lab ready</Badge>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <main className="rounded-lg border border-border bg-card shadow-sm">
          <div className="border-b border-border p-5">
            <div className="flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-md bg-foreground text-background">
                <Rocket aria-hidden="true" className="size-4" />
              </span>
              <div>
                <h2 className="text-base font-semibold">Prototype brief</h2>
                <p className="text-xs text-muted-foreground">This creates the backend project, roadmap, and Build Lab workspace.</p>
              </div>
            </div>
          </div>

          <form onSubmit={onSubmit} className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="space-y-4">
              <div className="grid gap-1.5">
                <Label htmlFor="title">Prototype title</Label>
                <Input
                  id="title"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Four-room office network lab"
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="summary">Build summary</Label>
                <Textarea
                  id="summary"
                  required
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="What will be built, simulated, validated, and submitted?"
                  className="min-h-28"
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="problem">Problem statement</Label>
                <Textarea
                  id="problem"
                  value={problemStatement}
                  onChange={(e) => setProblemStatement(e.target.value)}
                  placeholder="What real coursework, lab, community, or engineering problem does this solve?"
                  className="min-h-28"
                />
              </div>

              {error && <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

              {plan && (
                <div className="rounded-lg border border-border bg-background p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold">AI build plan</h3>
                    <Badge variant="outline">{plan.provider}</Badge>
                  </div>
                  {plan.disabledReason ? (
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">{plan.disabledReason}</p>
                  ) : (
                    <pre className="mt-3 whitespace-pre-wrap rounded-md bg-foreground p-4 text-xs leading-5 text-background">
                      {plan.text}
                    </pre>
                  )}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
                <Button type="submit" disabled={loading} className="bg-foreground text-background hover:bg-foreground/90">
                  {loading ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : <Rocket aria-hidden="true" className="size-4" />}
                  {loading ? "Creating..." : "Create prototype"}
                </Button>
                <Button type="button" variant="outline" disabled={planning} onClick={generatePlan}>
                  {planning ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : <Bot aria-hidden="true" className="size-4" />}
                  {planning ? "Generating..." : "Generate AI plan"}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.push("/projects")}>
                  Cancel
                </Button>
              </div>
            </div>

            <aside className="rounded-md border border-border bg-background p-4">
              <div className="mb-3 flex items-center gap-2">
                <Bot aria-hidden="true" className="size-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">AI-ready setup</h3>
              </div>
              <div className="space-y-3">
                {EVIDENCE.map((item) => (
                  <div key={item} className="flex gap-2 text-xs leading-5 text-muted-foreground">
                    <ShieldCheck aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-accent-foreground" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-md border border-dashed border-border p-3">
                <div className="mb-2 flex items-center gap-2 text-xs font-medium">
                  <Cable aria-hidden="true" className="size-3.5" />
                  Course lab example
                </div>
                <p className="text-[11px] leading-5 text-muted-foreground">
                  Select Networking lab to start from the office wiring case: devices, cable paths, rooms, validation, and AI support.
                </p>
              </div>
            </aside>
          </form>
        </main>

        <aside className="space-y-5">
          <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <div className="mb-3">
              <h2 className="text-sm font-semibold">Choose a starter mode</h2>
              <p className="mt-1 text-xs text-muted-foreground">Templates prefill the brief. You can edit everything before creating.</p>
            </div>
            <div className="space-y-2">
              {TEMPLATES.map((template) => {
                const Icon = template.icon;
                const active = selectedTemplate === template.name;
                return (
                  <button
                    key={template.name}
                    type="button"
                    className={`w-full rounded-md border p-3 text-left transition-colors ${
                      active ? "border-foreground bg-foreground text-background" : "border-border bg-background hover:bg-muted"
                    }`}
                    onClick={() => applyTemplate(template)}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`grid size-9 place-items-center rounded-md ${active ? "bg-background/15" : "bg-secondary text-secondary-foreground"}`}>
                        <Icon aria-hidden="true" className="size-4" />
                      </span>
                      <div>
                        <div className="text-xs font-semibold">{template.name}</div>
                        <div className={`mt-0.5 text-[11px] ${active ? "text-background/75" : "text-muted-foreground"}`}>
                          Prototype, simulate, review
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <h2 className="text-sm font-semibold">What happens next</h2>
            <div className="mt-3 space-y-3 text-xs text-muted-foreground">
              <Step number="01" title="Roadmap" text="A starter milestone plan is created for the prototype." />
              <Step number="02" title="Build Lab" text="Open the lab to assemble saved components, cables, circuits, and flows." />
              <Step number="03" title="Assessment" text="Attach feedback, GitHub links, simulation runs, and final evidence." />
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Step({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <div className="flex gap-3 rounded-md border border-border bg-background p-3">
      <span className="font-mono text-[10px] text-muted-foreground">{number}</span>
      <div>
        <div className="text-xs font-medium text-foreground">{title}</div>
        <p className="mt-1 text-[11px] leading-5">{text}</p>
      </div>
    </div>
  );
}
