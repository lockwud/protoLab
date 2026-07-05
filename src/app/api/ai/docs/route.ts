import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionPayload } from "@/lib/session";
import { generateAiText } from "@/lib/ai";
import { query, queryOne } from "@/lib/db";
import { createId } from "@/lib/id";

const schema = z.object({
  projectId: z.string(),
  docType: z.enum(["README", "REPORT", "PITCH"]).default("README"),
});

const SYSTEM_PROMPT =
  "You are ProtoLab's Documentation Generator. Write clear, professional project documentation in Markdown, based on the project details given. Match the requested document type's conventions.";

export async function POST(request: Request) {
  const session = await getSessionPayload();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 400 });

  const project = await queryOne<{ title: string; summary: string; problemStatement: string | null }>(
    `SELECT title, summary, "problemStatement" FROM "Project" WHERE id = $1`,
    [parsed.data.projectId]
  );
  if (!project) return NextResponse.json({ error: "Prototype not found." }, { status: 404 });

  const prompt = `Document type: ${parsed.data.docType}\nProject title: ${project.title}\nSummary: ${
    project.summary
  }\nProblem statement: ${project.problemStatement ?? "N/A"}`;

  const result = await generateAiText(prompt, SYSTEM_PROMPT);

  if (result.ok) {
    const id = createId("doc_");
    await query(
      `INSERT INTO "Document" (id, "projectId", "authorId", title, type, content)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, parsed.data.projectId, session.userId, `${parsed.data.docType} — ${project.title}`, parsed.data.docType, result.text]
    );
  }

  return NextResponse.json(result);
}
