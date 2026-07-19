CREATE TABLE IF NOT EXISTS "LabWorkspace" (
  id          TEXT PRIMARY KEY,
  "projectId" TEXT NOT NULL UNIQUE REFERENCES "Project"(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  mode        TEXT NOT NULL DEFAULT 'NETWORKING',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "ComponentInventory" (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  category    TEXT NOT NULL,
  kind        TEXT NOT NULL,
  description TEXT,
  metadata    JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "LabNode" (
  id            TEXT PRIMARY KEY,
  "workspaceId" TEXT NOT NULL REFERENCES "LabWorkspace"(id) ON DELETE CASCADE,
  "componentId" TEXT REFERENCES "ComponentInventory"(id),
  label         TEXT NOT NULL,
  type          TEXT NOT NULL,
  x             DOUBLE PRECISION NOT NULL DEFAULT 80,
  y             DOUBLE PRECISION NOT NULL DEFAULT 80,
  config        JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "LabConnection" (
  id             TEXT PRIMARY KEY,
  "workspaceId"  TEXT NOT NULL REFERENCES "LabWorkspace"(id) ON DELETE CASCADE,
  "sourceNodeId" TEXT NOT NULL REFERENCES "LabNode"(id) ON DELETE CASCADE,
  "targetNodeId" TEXT NOT NULL REFERENCES "LabNode"(id) ON DELETE CASCADE,
  label          TEXT,
  "connectionType" TEXT NOT NULL DEFAULT 'ethernet',
  config         JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "LabValidation" (
  id            TEXT PRIMARY KEY,
  "workspaceId" TEXT NOT NULL REFERENCES "LabWorkspace"(id) ON DELETE CASCADE,
  status        TEXT NOT NULL,
  issues        JSONB NOT NULL DEFAULT '[]'::jsonb,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lab_node_workspace ON "LabNode"("workspaceId");
CREATE INDEX IF NOT EXISTS idx_lab_connection_workspace ON "LabConnection"("workspaceId");
CREATE INDEX IF NOT EXISTS idx_lab_validation_workspace ON "LabValidation"("workspaceId");

INSERT INTO "ComponentInventory" (id, name, category, kind, description, metadata)
VALUES
  ('cmp_router', 'Router', 'networking', 'router', 'Routes traffic between networks and validates WAN/LAN design.', '{"ports": 4}'::jsonb),
  ('cmp_switch', 'Switch', 'networking', 'switch', 'Connects wired room devices and cable drops.', '{"ports": 24}'::jsonb),
  ('cmp_access_point', 'Access Point', 'networking', 'access_point', 'Provides wireless coverage for office rooms.', '{"band": "dual"}'::jsonb),
  ('cmp_pc', 'Workstation', 'networking', 'endpoint', 'Client computer or office endpoint.', '{"requiresNetwork": true}'::jsonb),
  ('cmp_cable', 'Ethernet Cable', 'networking', 'cable', 'CAT cable run for terminated network links.', '{"standard": "CAT6"}'::jsonb),
  ('cmp_arduino', 'Arduino Uno', 'electronics', 'microcontroller', 'Microcontroller board for embedded prototypes.', '{"voltage": "5V"}'::jsonb),
  ('cmp_sensor', 'Sensor Module', 'electronics', 'sensor', 'Generic sensor for IoT data collection.', '{"signal": "analog/digital"}'::jsonb),
  ('cmp_relay', 'Relay Module', 'electronics', 'actuator', 'Switches higher-load devices from a microcontroller.', '{"channels": 1}'::jsonb),
  ('cmp_led', 'LED Indicator', 'electronics', 'indicator', 'Visual output for circuit status.', '{"polarity": true}'::jsonb),
  ('cmp_web_page', 'Web Page', 'software', 'screen', 'Interface screen for web or mobile prototypes.', '{"route": "/"}'::jsonb),
  ('cmp_api', 'API Service', 'software', 'service', 'Backend route or service for data workflows.', '{"protocol": "HTTP"}'::jsonb),
  ('cmp_database', 'Database', 'software', 'database', 'Persistent storage for app data.', '{"engine": "PostgreSQL"}'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  kind = EXCLUDED.kind,
  description = EXCLUDED.description,
  metadata = EXCLUDED.metadata,
  "updatedAt" = now();
