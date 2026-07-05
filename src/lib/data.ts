import { query, queryOne } from "./db";
import type {
  Assignment,
  Course,
  Enrollment,
  Feedback,
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
