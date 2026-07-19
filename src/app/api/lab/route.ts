import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionPayload } from "@/lib/session";
import { query, queryOne, DatabaseUnavailableError } from "@/lib/db";
import { createId } from "@/lib/id";
import {
  getOrCreateLabWorkspace,
  latestLabSimulation,
  latestLabValidation,
  listComponentInventory,
  listLabConnections,
  listLabNodes,
} from "@/lib/data";
import { canAccessLabWorkspace } from "@/lib/lab-access";

async function canAccessProject(projectId: string, userId: string, role: string) {
  const project = await queryOne<{ id: string; title: string; ownerId: string }>(
    `SELECT id, title, "ownerId" FROM "Project" WHERE id = $1`,
    [projectId]
  );
  if (!project) return null;
  if (role === "STUDENT" && project.ownerId !== userId) return null;
  return project;
}

export async function GET(request: Request) {
  const session = await getSessionPayload();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");
  if (!projectId) return NextResponse.json({ error: "projectId is required." }, { status: 400 });

  try {
    const project = await canAccessProject(projectId, session.userId, session.role);
    if (!project) return NextResponse.json({ error: "Prototype not found." }, { status: 404 });

    const workspace = await getOrCreateLabWorkspace(project.id, project.title);
    const [components, nodes, connections, validation, simulation] = await Promise.all([
      listComponentInventory(),
      listLabNodes(workspace.id),
      listLabConnections(workspace.id),
      latestLabValidation(workspace.id),
      latestLabSimulation(workspace.id),
    ]);

    return NextResponse.json({ workspace, components, nodes, connections, validation, simulation });
  } catch (err) {
    if (err instanceof DatabaseUnavailableError) return NextResponse.json({ error: err.message }, { status: 503 });
    console.error(err);
    return NextResponse.json({ error: "Failed to load Build Lab." }, { status: 500 });
  }
}

const nodeSchema = z.object({
  workspaceId: z.string(),
  componentId: z.string().nullable().optional(),
  label: z.string().min(1),
  type: z.string().min(1),
  x: z.number().default(80),
  y: z.number().default(80),
  config: z.record(z.string(), z.unknown()).default({}),
});

const connectionSchema = z.object({
  workspaceId: z.string(),
  sourceNodeId: z.string(),
  targetNodeId: z.string(),
  label: z.string().optional(),
  connectionType: z.string().default("ethernet"),
  config: z.record(z.string(), z.unknown()).default({}),
});

export async function POST(request: Request) {
  const session = await getSessionPayload();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const action = body?.action;

  try {
    if (action === "node") {
      const parsed = nodeSchema.safeParse(body);
      if (!parsed.success) return NextResponse.json({ error: "Invalid node input." }, { status: 400 });
      const workspace = await canAccessLabWorkspace(parsed.data.workspaceId, session.userId, session.role);
      if (!workspace) return NextResponse.json({ error: "Build Lab not found." }, { status: 404 });
      const rows = await query(
        `INSERT INTO "LabNode" (id, "workspaceId", "componentId", label, type, x, y, config)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [
          createId("lbn_"),
          parsed.data.workspaceId,
          parsed.data.componentId ?? null,
          parsed.data.label,
          parsed.data.type,
          parsed.data.x,
          parsed.data.y,
          JSON.stringify(parsed.data.config),
        ]
      );
      return NextResponse.json({ node: rows[0] }, { status: 201 });
    }

    if (action === "connection") {
      const parsed = connectionSchema.safeParse(body);
      if (!parsed.success) return NextResponse.json({ error: "Invalid connection input." }, { status: 400 });
      const workspace = await canAccessLabWorkspace(parsed.data.workspaceId, session.userId, session.role);
      if (!workspace) return NextResponse.json({ error: "Build Lab not found." }, { status: 404 });
      if (parsed.data.sourceNodeId === parsed.data.targetNodeId) {
        return NextResponse.json({ error: "Choose two different nodes." }, { status: 400 });
      }
      const [source, target] = await Promise.all([
        queryOne<{ id: string }>(`SELECT id FROM "LabNode" WHERE id = $1 AND "workspaceId" = $2`, [
          parsed.data.sourceNodeId,
          parsed.data.workspaceId,
        ]),
        queryOne<{ id: string }>(`SELECT id FROM "LabNode" WHERE id = $1 AND "workspaceId" = $2`, [
          parsed.data.targetNodeId,
          parsed.data.workspaceId,
        ]),
      ]);
      if (!source || !target) return NextResponse.json({ error: "Both nodes must belong to this Build Lab." }, { status: 400 });
      const rows = await query(
        `INSERT INTO "LabConnection" (id, "workspaceId", "sourceNodeId", "targetNodeId", label, "connectionType", config)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [
          createId("lbc_"),
          parsed.data.workspaceId,
          parsed.data.sourceNodeId,
          parsed.data.targetNodeId,
          parsed.data.label ?? null,
          parsed.data.connectionType,
          JSON.stringify(parsed.data.config),
        ]
      );
      return NextResponse.json({ connection: rows[0] }, { status: 201 });
    }

    return NextResponse.json({ error: "Unknown lab action." }, { status: 400 });
  } catch (err) {
    if (err instanceof DatabaseUnavailableError) return NextResponse.json({ error: err.message }, { status: 503 });
    console.error(err);
    return NextResponse.json({ error: "Failed to update Build Lab." }, { status: 500 });
  }
}
