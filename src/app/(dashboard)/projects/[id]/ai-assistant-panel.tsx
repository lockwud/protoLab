"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Project } from "@/types";

export function AiAssistantPanel({ projectId, project }: { projectId: string; project: Project }) {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [disabledReason, setDisabledReason] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [docLoading, setDocLoading] = useState<string | null>(null);
  const [docResult, setDocResult] = useState<string | null>(null);

  async function ask() {
    if (!prompt.trim()) return;
    setLoading(true);
    setResponse(null);
    setDisabledReason(null);
    try {
      const res = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt, projectId }),
      });
      const data = await res.json();
      if (data.ok) setResponse(data.text);
      else setDisabledReason(data.disabledReason ?? "The AI assistant is currently unavailable.");
    } finally {
      setLoading(false);
    }
  }

  async function generateDoc(docType: "README" | "REPORT" | "PITCH") {
    setDocLoading(docType);
    setDocResult(null);
    setDisabledReason(null);
    try {
      const res = await fetch("/api/ai/docs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ projectId, docType }),
      });
      const data = await res.json();
      if (data.ok) setDocResult(data.text);
      else setDisabledReason(data.disabledReason ?? "Documentation generation is currently unavailable.");
    } finally {
      setDocLoading(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">AI Prototype Assistant</CardTitle>
          <CardDescription>Ask for help unblocking a bug, scoping a feature, or making a decision.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={`e.g. "What's a reasonable data model for ${project.title}?"`}
          />
          <Button size="sm" onClick={ask} disabled={loading} className="self-start">
            {loading ? "Thinking…" : "Ask"}
          </Button>
          {disabledReason && (
            <p className="rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground">
              {disabledReason}
            </p>
          )}
          {response && <div className="whitespace-pre-wrap rounded-md border border-border bg-muted/40 p-3 text-sm">{response}</div>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Documentation generator</CardTitle>
          <CardDescription>Generate a README, project report, or pitch draft from your prototype details.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex gap-2">
            {(["README", "REPORT", "PITCH"] as const).map((t) => (
              <Button key={t} size="sm" variant="outline" disabled={docLoading !== null} onClick={() => generateDoc(t)}>
                {docLoading === t ? "Generating…" : `Generate ${t}`}
              </Button>
            ))}
          </div>
          {docResult && (
            <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-md border border-border bg-muted/40 p-3 text-xs">
              {docResult}
            </pre>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
