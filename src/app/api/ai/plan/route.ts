import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionPayload } from "@/lib/session";
import { generateAiText } from "@/lib/ai";

const schema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  problemStatement: z.string().optional(),
});

const SYSTEM_PROMPT =
  "You are ProtoLab's Prototype Planning Engine. Given a project idea, produce a short, actionable build plan: 4-6 milestones with one-line descriptions, in the order they should be tackled. Keep it concise and concrete, no preamble.";

export async function POST(request: Request) {
  const session = await getSessionPayload();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 400 });

  const prompt = `Project: ${parsed.data.title}\nSummary: ${parsed.data.summary}\nProblem statement: ${
    parsed.data.problemStatement ?? "N/A"
  }\n\nGenerate the milestone plan.`;

  const result = await generateAiText(prompt, SYSTEM_PROMPT);
  return NextResponse.json(result);
}
