CREATE TABLE IF NOT EXISTS "LabSimulation" (
  id            TEXT PRIMARY KEY,
  "workspaceId" TEXT NOT NULL REFERENCES "LabWorkspace"(id) ON DELETE CASCADE,
  status        TEXT NOT NULL,
  summary       TEXT NOT NULL,
  traces        JSONB NOT NULL DEFAULT '[]'::jsonb,
  metrics       JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lab_simulation_workspace ON "LabSimulation"("workspaceId");
