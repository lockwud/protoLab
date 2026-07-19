import { queryOne } from "./db";

export async function canAccessLabWorkspace(workspaceId: string, userId: string, role: string) {
  const workspace = await queryOne<{ id: string; projectId: string; ownerId: string }>(
    `SELECT w.id, w."projectId", p."ownerId"
     FROM "LabWorkspace" w
     JOIN "Project" p ON p.id = w."projectId"
     WHERE w.id = $1`,
    [workspaceId]
  );
  if (!workspace) return null;
  if (role === "STUDENT" && workspace.ownerId !== userId) return null;
  return workspace;
}

export async function canAccessLabNode(nodeId: string, userId: string, role: string) {
  const node = await queryOne<{ id: string; workspaceId: string; ownerId: string }>(
    `SELECT n.id, n."workspaceId", p."ownerId"
     FROM "LabNode" n
     JOIN "LabWorkspace" w ON w.id = n."workspaceId"
     JOIN "Project" p ON p.id = w."projectId"
     WHERE n.id = $1`,
    [nodeId]
  );
  if (!node) return null;
  if (role === "STUDENT" && node.ownerId !== userId) return null;
  return node;
}

export async function canAccessLabConnection(connectionId: string, userId: string, role: string) {
  const connection = await queryOne<{ id: string; workspaceId: string; ownerId: string }>(
    `SELECT c.id, c."workspaceId", p."ownerId"
     FROM "LabConnection" c
     JOIN "LabWorkspace" w ON w.id = c."workspaceId"
     JOIN "Project" p ON p.id = w."projectId"
     WHERE c.id = $1`,
    [connectionId]
  );
  if (!connection) return null;
  if (role === "STUDENT" && connection.ownerId !== userId) return null;
  return connection;
}
