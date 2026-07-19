export type Role = "STUDENT" | "LECTURER" | "ADMIN";

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  avatarUrl: string | null;
  bio: string | null;
  githubUsername: string | null;
  createdAt: string;
  updatedAt: string;
}

export type PublicUser = Omit<User, "passwordHash">;

export type EnrollmentStatus = "ACTIVE" | "COMPLETED" | "DROPPED";
export type AssignmentStatus = "DRAFT" | "PUBLISHED" | "CLOSED";
export type SubmissionStatus =
  | "NOT_SUBMITTED"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "REVISION_REQUESTED"
  | "APPROVED";
export type MilestoneStatus = "PENDING" | "IN_PROGRESS" | "DONE" | "BLOCKED";
export type NotificationType = "INFO" | "ASSIGNMENT" | "FEEDBACK" | "MILESTONE" | "SYSTEM";

export interface Course {
  id: string;
  title: string;
  code: string;
  description: string | null;
  lecturerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  status: EnrollmentStatus;
  createdAt: string;
}

export interface Assignment {
  id: string;
  courseId: string;
  title: string;
  description: string;
  status: AssignmentStatus;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  projectId: string | null;
  content: string;
  fileUrl: string | null;
  status: SubmissionStatus;
  grade: number | null;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  title: string;
  summary: string;
  problemStatement: string | null;
  ownerId: string;
  assignmentId: string | null;
  githubRepoUrl: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: MilestoneStatus;
  dueDate: string | null;
  ownerId: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Feedback {
  id: string;
  projectId: string | null;
  submissionId: string | null;
  authorId: string;
  content: string;
  rating: number | null;
  createdAt: string;
}

export interface DocumentRecord {
  id: string;
  projectId: string;
  authorId: string;
  title: string;
  type: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface InnovationRepositoryEntry {
  id: string;
  projectId: string;
  authorId: string;
  featured: boolean;
  tags: string[];
  publishedAt: string;
}

export type LabMode = "NETWORKING" | "ELECTRONICS" | "SOFTWARE" | "MIXED";

export interface LabWorkspace {
  id: string;
  projectId: string;
  title: string;
  mode: LabMode;
  createdAt: string;
  updatedAt: string;
}

export interface ComponentInventory {
  id: string;
  name: string;
  category: string;
  kind: string;
  description: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface LabNode {
  id: string;
  workspaceId: string;
  componentId: string | null;
  label: string;
  type: string;
  x: number;
  y: number;
  config: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface LabConnection {
  id: string;
  workspaceId: string;
  sourceNodeId: string;
  targetNodeId: string;
  label: string | null;
  connectionType: string;
  config: Record<string, unknown>;
  createdAt: string;
}

export interface LabValidation {
  id: string;
  workspaceId: string;
  status: "PASS" | "WARN" | "FAIL";
  issues: Array<{ severity: "info" | "warning" | "error"; message: string }>;
  createdAt: string;
}

export interface LabSimulation {
  id: string;
  workspaceId: string;
  status: "PASS" | "WARN" | "FAIL";
  summary: string;
  traces: Array<{
    type: "network" | "electronics" | "software" | "system";
    title: string;
    detail: string;
    status: "pass" | "warn" | "fail";
  }>;
  metrics: Record<string, unknown>;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  link: string | null;
  createdAt: string;
}

export interface SessionPayload {
  userId: string;
  role: Role;
  email: string;
  name: string;
}
