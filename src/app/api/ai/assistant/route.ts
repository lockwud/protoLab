import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionPayload } from "@/lib/session";
import { generateAiText } from "@/lib/ai";
import { query } from "@/lib/db";
import { createId } from "@/lib/id";

const schema = z.object({
  prompt: z.string().min(1),
  projectId: z.string().optional(),
});

const SYSTEM_PROMPT =
  "You are ProtoLab's AI Prototype Assistant. You help students think through technical decisions, unblock bugs, and scope features for their innovation prototypes. Be concise, practical, and specific to their stack.";

export async function POST(request: Request) {
  const session = await getSessionPayload();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 400 });

  const result = await generateAiText(parsed.data.prompt, SYSTEM_PROMPT);

  if (result.ok) {
    try {
      await query(
        `INSERT INTO "AiSession" (id, "projectId", prompt, response, provider) VALUES ($1, $2, $3, $4, $5)`,
        [createId("ai_"), parsed.data.projectId ?? null, parsed.data.prompt, result.text, result.provider]
      );
    } catch {
      // Non-fatal: still return the AI response even if logging the session fails.
    }
  }

  return NextResponse.json(result);
}
