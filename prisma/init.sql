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
