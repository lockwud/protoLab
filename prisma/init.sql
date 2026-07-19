-- ProtoLab initial schema (hand-authored from prisma/schema.prisma)
-- Safe to re-run: uses IF NOT EXISTS / DROP TYPE guards.

DO $$ BEGIN
  CREATE TYPE "Role" AS ENUM ('STUDENT', 'LECTURER', 'ADMIN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "EnrollmentStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'DROPPED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "AssignmentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "SubmissionStatus" AS ENUM ('NOT_SUBMITTED', 'SUBMITTED', 'UNDER_REVIEW', 'REVISION_REQUESTED', 'APPROVED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "MilestoneStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'DONE', 'BLOCKED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "NotificationType" AS ENUM ('INFO', 'ASSIGNMENT', 'FEEDBACK', 'MILESTONE', 'SYSTEM');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "User" (
  id             TEXT PRIMARY KEY,
  name           TEXT NOT NULL,
  email          TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT NOT NULL,
  role           "Role" NOT NULL DEFAULT 'STUDENT',
  "avatarUrl"    TEXT,
  bio            TEXT,
  "githubUsername" TEXT,
  "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_user_email ON "User"(email);

CREATE TABLE IF NOT EXISTS "UserNotificationSettings" (
  id                      TEXT PRIMARY KEY,
  "userId"                TEXT NOT NULL UNIQUE REFERENCES "User"(id) ON DELETE CASCADE,
  "feedbackNotifications" BOOLEAN NOT NULL DEFAULT true,
  "milestoneNotifications" BOOLEAN NOT NULL DEFAULT true,
  "taskNotifications"     BOOLEAN NOT NULL DEFAULT false,
  "githubIntegration"     BOOLEAN NOT NULL DEFAULT false,
  "auditMode"             BOOLEAN NOT NULL DEFAULT false,
  "createdAt"             TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"             TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_user_notification_settings_user_id ON "UserNotificationSettings"("userId");

CREATE TABLE IF NOT EXISTS "Course" (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  code        TEXT NOT NULL UNIQUE,
  description TEXT,
  "lecturerId" TEXT NOT NULL REFERENCES "User"(id),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Enrollment" (
  id         TEXT PRIMARY KEY,
  "studentId" TEXT NOT NULL REFERENCES "User"(id),
  "courseId"  TEXT NOT NULL REFERENCES "Course"(id),
  status     "EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("studentId", "courseId")
);

CREATE TABLE IF NOT EXISTS "Assignment" (
  id          TEXT PRIMARY KEY,
  "courseId"  TEXT NOT NULL REFERENCES "Course"(id),
  title       TEXT NOT NULL,
  description TEXT NOT NULL,
  status      "AssignmentStatus" NOT NULL DEFAULT 'DRAFT',
  "dueDate"   TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Submission" (
  id             TEXT PRIMARY KEY,
  "assignmentId" TEXT NOT NULL REFERENCES "Assignment"(id),
  "studentId"    TEXT NOT NULL REFERENCES "User"(id),
  content        TEXT NOT NULL,
  "fileUrl"      TEXT,
  status         "SubmissionStatus" NOT NULL DEFAULT 'NOT_SUBMITTED',
  grade          DOUBLE PRECISION,
  "submittedAt"  TIMESTAMPTZ,
  "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("assignmentId", "studentId")
);

CREATE TABLE IF NOT EXISTS "Project" (
  id                 TEXT PRIMARY KEY,
  title              TEXT NOT NULL,
  summary            TEXT NOT NULL,
  "problemStatement" TEXT,
  "ownerId"          TEXT NOT NULL REFERENCES "User"(id),
  "assignmentId"     TEXT REFERENCES "Assignment"(id),
  "githubRepoUrl"    TEXT,
  status             TEXT NOT NULL DEFAULT 'PLANNING',
  "createdAt"        TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Milestone" (
  id          TEXT PRIMARY KEY,
  "projectId" TEXT NOT NULL REFERENCES "Project"(id),
  title       TEXT NOT NULL,
  description TEXT,
  status      "MilestoneStatus" NOT NULL DEFAULT 'PENDING',
  "dueDate"   TIMESTAMPTZ,
  "ownerId"   TEXT NOT NULL REFERENCES "User"(id),
  "order"     INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Feedback" (
  id             TEXT PRIMARY KEY,
  "projectId"    TEXT REFERENCES "Project"(id),
  "submissionId" TEXT REFERENCES "Submission"(id),
  "authorId"     TEXT NOT NULL REFERENCES "User"(id),
  content        TEXT NOT NULL,
  rating         INTEGER,
  "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Document" (
  id          TEXT PRIMARY KEY,
  "projectId" TEXT NOT NULL REFERENCES "Project"(id),
  "authorId"  TEXT NOT NULL REFERENCES "User"(id),
  title       TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'REPORT',
  content     TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "AiSession" (
  id          TEXT PRIMARY KEY,
  "projectId" TEXT REFERENCES "Project"(id),
  prompt      TEXT NOT NULL,
  response    TEXT NOT NULL,
  provider    TEXT NOT NULL DEFAULT 'claude',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "InnovationRepository" (
  id            TEXT PRIMARY KEY,
  "projectId"   TEXT NOT NULL UNIQUE REFERENCES "Project"(id),
  "authorId"    TEXT NOT NULL REFERENCES "User"(id),
  featured      BOOLEAN NOT NULL DEFAULT false,
  tags          TEXT[] NOT NULL DEFAULT '{}',
  "publishedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Notification" (
  id         TEXT PRIMARY KEY,
  "userId"   TEXT NOT NULL REFERENCES "User"(id),
  type       "NotificationType" NOT NULL DEFAULT 'INFO',
  title      TEXT NOT NULL,
  message    TEXT NOT NULL,
  read       BOOLEAN NOT NULL DEFAULT false,
  link       TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

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

CREATE TABLE IF NOT EXISTS "LabSimulation" (
  id            TEXT PRIMARY KEY,
  "workspaceId" TEXT NOT NULL REFERENCES "LabWorkspace"(id) ON DELETE CASCADE,
  status        TEXT NOT NULL,
  summary       TEXT NOT NULL,
  traces        JSONB NOT NULL DEFAULT '[]'::jsonb,
  metrics       JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lab_node_workspace ON "LabNode"("workspaceId");
CREATE INDEX IF NOT EXISTS idx_lab_connection_workspace ON "LabConnection"("workspaceId");
CREATE INDEX IF NOT EXISTS idx_lab_validation_workspace ON "LabValidation"("workspaceId");
CREATE INDEX IF NOT EXISTS idx_lab_simulation_workspace ON "LabSimulation"("workspaceId");

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
  ('cmp_buzzer', 'Piezo Buzzer', 'electronics', 'buzzer', 'Audible output for Arduino alerts and demonstration beeps.', '{"pin": 8}'::jsonb),
  ('cmp_web_page', 'Web Page', 'software', 'screen', 'Interface screen for web or mobile prototypes.', '{"route": "/"}'::jsonb),
  ('cmp_web_nav', 'Navigation Bar', 'web-ui', 'ui_block', 'Header navigation for a web prototype screen.', '{"variant": "nav", "width": 460, "height": 58}'::jsonb),
  ('cmp_web_hero', 'Hero Section', 'web-ui', 'ui_block', 'Landing section with headline, copy, and action area.', '{"variant": "hero", "width": 520, "height": 150}'::jsonb),
  ('cmp_web_card', 'Data Card', 'web-ui', 'ui_block', 'Dashboard-style metric, content, or feature card.', '{"variant": "card", "width": 240, "height": 130}'::jsonb),
  ('cmp_web_form', 'Form Panel', 'web-ui', 'ui_block', 'Input form layout for login, intake, or submission screens.', '{"variant": "form", "width": 300, "height": 180}'::jsonb),
  ('cmp_web_button', 'Primary Action', 'web-ui', 'ui_block', 'Clickable call-to-action element for screen mockups.', '{"variant": "button", "width": 180, "height": 54}'::jsonb),
  ('cmp_api', 'API Service', 'software', 'service', 'Backend route or service for data workflows.', '{"protocol": "HTTP"}'::jsonb),
  ('cmp_database', 'Database', 'software', 'database', 'Persistent storage for app data.', '{"engine": "PostgreSQL"}'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  kind = EXCLUDED.kind,
  description = EXCLUDED.description,
  metadata = EXCLUDED.metadata,
  "updatedAt" = now();
