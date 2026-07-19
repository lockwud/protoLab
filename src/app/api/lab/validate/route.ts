import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionPayload } from "@/lib/session";
import { query, DatabaseUnavailableError } from "@/lib/db";
import { createId } from "@/lib/id";
import { canAccessLabWorkspace } from "@/lib/lab-access";
import type { LabConnection, LabNode } from "@/types";

const schema = z.object({ workspaceId: z.string() });

type Issue = { severity: "info" | "warning" | "error"; message: string };

export async function POST(request: Request) {
  const session = await getSessionPayload();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "workspaceId is required." }, { status: 400 });

  try {
    const workspace = await canAccessLabWorkspace(parsed.data.workspaceId, session.userId, session.role);
    if (!workspace) return NextResponse.json({ error: "Build Lab not found." }, { status: 404 });

    const [nodes, connections] = await Promise.all([
      query<LabNode>(`SELECT * FROM "LabNode" WHERE "workspaceId" = $1`, [parsed.data.workspaceId]),
      query<LabConnection>(`SELECT * FROM "LabConnection" WHERE "workspaceId" = $1`, [parsed.data.workspaceId]),
    ]);

    const issues = validateLab(nodes, connections);
    const status = issues.some((issue) => issue.severity === "error")
      ? "FAIL"
      : issues.some((issue) => issue.severity === "warning")
        ? "WARN"
        : "PASS";

    const rows = await query(
      `INSERT INTO "LabValidation" (id, "workspaceId", status, issues)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [createId("lbv_"), parsed.data.workspaceId, status, JSON.stringify(issues)]
    );

    return NextResponse.json({ validation: rows[0] });
  } catch (err) {
    if (err instanceof DatabaseUnavailableError) return NextResponse.json({ error: err.message }, { status: 503 });
    console.error(err);
    return NextResponse.json({ error: "Failed to validate lab." }, { status: 500 });
  }
}

function validateLab(nodes: LabNode[], connections: LabConnection[]): Issue[] {
  const issues: Issue[] = [];
  if (nodes.length === 0) {
    return [{ severity: "error", message: "Add at least one component to the Build Lab canvas." }];
  }

  const connectedIds = new Set<string>();
  connections.forEach((connection) => {
    connectedIds.add(connection.sourceNodeId);
    connectedIds.add(connection.targetNodeId);
  });

  const isolated = nodes.filter((node) => !connectedIds.has(node.id));
  if (isolated.length > 0 && nodes.length > 1) {
    issues.push({ severity: "warning", message: `${isolated.length} component(s) are not connected to the prototype.` });
  }

  const kinds = nodes.map((node) => node.type);
  const hasNetworking = kinds.some((kind) => ["router", "switch", "access_point", "endpoint", "cable"].includes(kind));
  const hasElectronics = kinds.some((kind) => ["microcontroller", "sensor", "actuator", "indicator", "buzzer"].includes(kind));
  const hasSoftware = kinds.some((kind) => ["screen", "service", "database", "ui_block"].includes(kind));

  if (hasNetworking) {
    if (!kinds.includes("router") && !kinds.includes("switch")) {
      issues.push({ severity: "error", message: "Networking labs need at least one router or switch." });
    }
    if (!kinds.includes("endpoint") && !kinds.includes("access_point")) {
      issues.push({ severity: "warning", message: "Add an endpoint or access point to test network service delivery." });
    }
    if (connections.length === 0 && nodes.length > 1) {
      issues.push({ severity: "error", message: "Networking components need cable or logical connections." });
    }
  }

  if (hasElectronics) {
    if (!kinds.includes("microcontroller")) {
      issues.push({ severity: "error", message: "Electronics or IoT labs need a microcontroller/controller board." });
    }
    if (!kinds.includes("sensor") && !kinds.includes("actuator") && !kinds.includes("indicator") && !kinds.includes("buzzer")) {
      issues.push({ severity: "warning", message: "Add at least one input or output component for circuit testing." });
    }
  }

  if (hasSoftware) {
    if (!kinds.includes("screen") && !kinds.includes("service") && !kinds.includes("ui_block")) {
      issues.push({ severity: "warning", message: "Software prototypes should include a screen or API service." });
    }
    if (kinds.includes("ui_block") && !kinds.includes("screen")) {
      issues.push({ severity: "warning", message: "Add a Web Page component behind UI blocks to document the screen route." });
    }
  }

  if (issues.length === 0) {
    issues.push({ severity: "info", message: "Validation passed. The lab has enough structure for a first prototype review." });
  }
  return issues;
}
