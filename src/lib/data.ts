import { query, queryOne } from "./db";
import type {
  Assignment,
  Course,
  Enrollment,
  Feedback,
  ComponentInventory,
  LabConnection,
  LabNode,
  LabSimulation,
  LabValidation,
  LabWorkspace,
  Milestone,
  Notification,
  Project,
  Submission,
} from "@/types";

// ---- Courses ----
export function listCoursesForLecturer(lecturerId: string) {
  return query<Course>(`SELECT * FROM "Course" WHERE "lecturerId" = $1 ORDER BY "createdAt" DESC`, [
    lecturerId,
  ]);
}

export function listCoursesForStudent(studentId: string) {
  return query<Course & { enrollmentStatus: string }>(
    `SELECT c.*, e.status as "enrollmentStatus"
     FROM "Course" c
     JOIN "Enrollment" e ON e."courseId" = c.id
     WHERE e."studentId" = $1
     ORDER BY c."createdAt" DESC`,
    [studentId]
  );
}

export function listAllCourses() {
  return query<Course>(`SELECT * FROM "Course" ORDER BY "createdAt" DESC`);
}

export function getCourse(id: string) {
  return queryOne<Course>(`SELECT * FROM "Course" WHERE id = $1`, [id]);
}

// ---- Enrollments ----
export function listEnrollmentsForCourse(courseId: string) {
  return query<Enrollment & { studentName: string; studentEmail: string }>(
    `SELECT e.*, u.name as "studentName", u.email as "studentEmail"
     FROM "Enrollment" e JOIN "User" u ON u.id = e."studentId"
     WHERE e."courseId" = $1 ORDER BY e."createdAt" DESC`,
    [courseId]
  );
}

// ---- Assignments ----
export function listAssignmentsForCourse(courseId: string) {
  return query<Assignment>(`SELECT * FROM "Assignment" WHERE "courseId" = $1 ORDER BY "createdAt" DESC`, [
    courseId,
  ]);
}

export function listAssignmentsForStudent(studentId: string) {
  return query<Assignment & { courseTitle: string; courseCode: string }>(
    `SELECT a.*, c.title as "courseTitle", c.code as "courseCode"
     FROM "Assignment" a
     JOIN "Course" c ON c.id = a."courseId"
     JOIN "Enrollment" e ON e."courseId" = c.id
     WHERE e."studentId" = $1 AND a.status = 'PUBLISHED'
     ORDER BY a."dueDate" ASC NULLS LAST`,
    [studentId]
  );
}

export function listAssignmentsForLecturer(lecturerId: string) {
  return query<Assignment & { courseTitle: string }>(
    `SELECT a.*, c.title as "courseTitle"
     FROM "Assignment" a JOIN "Course" c ON c.id = a."courseId"
     WHERE c."lecturerId" = $1 ORDER BY a."createdAt" DESC`,
    [lecturerId]
  );
}

export function getAssignment(id: string) {
  return queryOne<Assignment>(`SELECT * FROM "Assignment" WHERE id = $1`, [id]);
}

// ---- Submissions ----
export function listSubmissionsForAssignment(assignmentId: string) {
  return query<Submission & { studentName: string; studentEmail: string }>(
    `SELECT s.*, u.name as "studentName", u.email as "studentEmail"
     FROM "Submission" s JOIN "User" u ON u.id = s."studentId"
     WHERE s."assignmentId" = $1 ORDER BY s."submittedAt" DESC NULLS LAST`,
    [assignmentId]
  );
}

export function getSubmissionForStudent(assignmentId: string, studentId: string) {
  return queryOne<Submission>(
    `SELECT * FROM "Submission" WHERE "assignmentId" = $1 AND "studentId" = $2`,
    [assignmentId, studentId]
  );
}

// ---- Projects (prototypes) ----
export function listProjectsForOwner(ownerId: string) {
  return query<Project>(`SELECT * FROM "Project" WHERE "ownerId" = $1 ORDER BY "createdAt" DESC`, [
    ownerId,
  ]);
}

export function listAllProjects() {
  return query<Project & { ownerName: string }>(
    `SELECT p.*, u.name as "ownerName" FROM "Project" p JOIN "User" u ON u.id = p."ownerId"
     ORDER BY p."createdAt" DESC`
  );
}

export function getProject(id: string) {
  return queryOne<Project>(`SELECT * FROM "Project" WHERE id = $1`, [id]);
}

export async function getOrCreateLabWorkspace(projectId: string, title: string) {
  const existing = await queryOne<LabWorkspace>(`SELECT * FROM "LabWorkspace" WHERE "projectId" = $1`, [projectId]);
  if (existing) return existing;
  const { createId } = await import("./id");
  const rows = await query<LabWorkspace>(
    `INSERT INTO "LabWorkspace" (id, "projectId", title, mode)
     VALUES ($1, $2, $3, 'MIXED') RETURNING *`,
    [createId("lab_"), projectId, `${title} Build Lab`]
  );
  return rows[0];
}

export function listComponentInventory() {
  return query<ComponentInventory>(`SELECT * FROM "ComponentInventory" ORDER BY category ASC, name ASC`);
}

export function listLabNodes(workspaceId: string) {
  return query<LabNode>(`SELECT * FROM "LabNode" WHERE "workspaceId" = $1 ORDER BY "createdAt" ASC`, [workspaceId]);
}

export function listLabConnections(workspaceId: string) {
  return query<LabConnection>(
    `SELECT * FROM "LabConnection" WHERE "workspaceId" = $1 ORDER BY "createdAt" ASC`,
    [workspaceId]
  );
}

export function latestLabValidation(workspaceId: string) {
  return queryOne<LabValidation>(
    `SELECT * FROM "LabValidation" WHERE "workspaceId" = $1 ORDER BY "createdAt" DESC LIMIT 1`,
    [workspaceId]
  );
}

export function latestLabSimulation(workspaceId: string) {
  return queryOne<LabSimulation>(
    `SELECT * FROM "LabSimulation" WHERE "workspaceId" = $1 ORDER BY "createdAt" DESC LIMIT 1`,
    [workspaceId]
  );
}

// ---- Milestones ----
export function listMilestonesForProject(projectId: string) {
  return query<Milestone>(`SELECT * FROM "Milestone" WHERE "projectId" = $1 ORDER BY "order" ASC`, [
    projectId,
  ]);
}

// ---- Feedback ----
export function listFeedbackForProject(projectId: string) {
  return query<Feedback & { authorName: string }>(
    `SELECT f.*, u.name as "authorName" FROM "Feedback" f JOIN "User" u ON u.id = f."authorId"
     WHERE f."projectId" = $1 ORDER BY f."createdAt" DESC`,
    [projectId]
  );
}

// ---- Notifications ----
export function listNotificationsForUser(userId: string) {
  return query<Notification>(`SELECT * FROM "Notification" WHERE "userId" = $1 ORDER BY "createdAt" DESC LIMIT 50`, [
    userId,
  ]);
}

export function countUnreadNotifications(userId: string) {
  return queryOne<{ count: string }>(
    `SELECT count(*) FROM "Notification" WHERE "userId" = $1 AND read = false`,
    [userId]
  );
}

export async function notify(
  userId: string,
  title: string,
  message: string,
  type: Notification["type"] = "INFO",
  link?: string
) {
  const { createId } = await import("./id");
  await query(
    `INSERT INTO "Notification" (id, "userId", type, title, message, link)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [createId("ntf_"), userId, type, title, message, link ?? null]
  );
}

// ---- User Notification Settings ----
export function getUserNotificationSettings(userId: string) {
  return queryOne<{
    id: string;
    userId: string;
    feedbackNotifications: boolean;
    milestoneNotifications: boolean;
    taskNotifications: boolean;
    githubIntegration: boolean;
    auditMode: boolean;
    createdAt: string;
    updatedAt: string;
  }>(
    `SELECT * FROM "UserNotificationSettings" WHERE "userId" = $1`,
    [userId]
  );
}

export async function createOrUpdateUserNotificationSettings(
  userId: string,
  settings: {
    feedbackNotifications?: boolean;
    milestoneNotifications?: boolean;
    taskNotifications?: boolean;
    githubIntegration?: boolean;
    auditMode?: boolean;
  }
) {
  const { createId } = await import("./id");
  
  // Try to get existing settings
  const existing = await getUserNotificationSettings(userId);
  
  if (existing) {
    // Update existing
    await query(
      `UPDATE "UserNotificationSettings" 
       SET "feedbackNotifications" = COALESCE($2, "feedbackNotifications"),
           "milestoneNotifications" = COALESCE($3, "milestoneNotifications"),
           "taskNotifications" = COALESCE($4, "taskNotifications"),
           "githubIntegration" = COALESCE($5, "githubIntegration"),
           "auditMode" = COALESCE($6, "auditMode"),
           "updatedAt" = now()
       WHERE "userId" = $1`,
      [
        userId,
        settings.feedbackNotifications ?? null,
        settings.milestoneNotifications ?? null,
        settings.taskNotifications ?? null,
        settings.githubIntegration ?? null,
        settings.auditMode ?? null,
      ]
    );
  } else {
    // Create new with defaults
    await query(
      `INSERT INTO "UserNotificationSettings" 
       (id, "userId", "feedbackNotifications", "milestoneNotifications", "taskNotifications", "githubIntegration", "auditMode")
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        createId("uns_"),
        userId,
        settings.feedbackNotifications ?? true,
        settings.milestoneNotifications ?? true,
        settings.taskNotifications ?? false,
        settings.githubIntegration ?? false,
        settings.auditMode ?? false,
      ]
    );
  }
  
  return getUserNotificationSettings(userId);
}
