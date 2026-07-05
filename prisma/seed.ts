/**
 * Seed script — populates the database with realistic demo data.
 * Run with: pnpm db:seed
 */
import "dotenv/config";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

function id(prefix = "") {
  return `${prefix}${Date.now().toString(36)}${randomBytes(6).toString("hex")}`;
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  console.log("Seeding ProtoLab database…");
  const passwordHash = await bcrypt.hash("password123", 10);

  const lecturerId = id("usr_");
  const student1Id = id("usr_");
  const student2Id = id("usr_");

  await pool.query(
    `INSERT INTO "User" (id, name, email, "passwordHash", role) VALUES
     ($1, 'Dr. Ama Owusu', 'lecturer@protolab.dev', $4, 'LECTURER'),
     ($2, 'Kwame Boateng', 'student1@protolab.dev', $4, 'STUDENT'),
     ($3, 'Efua Mensah', 'student2@protolab.dev', $4, 'STUDENT')
     ON CONFLICT (email) DO NOTHING`,
    [lecturerId, student1Id, student2Id, passwordHash]
  );

  const courseId = id("crs_");
  await pool.query(
    `INSERT INTO "Course" (id, title, code, description, "lecturerId")
     VALUES ($1, 'Software Innovation Lab', 'IT-401', 'Capstone innovation and prototyping course.', $2)
     ON CONFLICT (code) DO NOTHING`,
    [courseId, lecturerId]
  );

  await pool.query(
    `INSERT INTO "Enrollment" (id, "studentId", "courseId") VALUES ($1, $2, $3), ($4, $5, $3)
     ON CONFLICT ("studentId", "courseId") DO NOTHING`,
    [id("enr_"), student1Id, courseId, id("enr_"), student2Id]
  );

  const assignmentId = id("asg_");
  await pool.query(
    `INSERT INTO "Assignment" (id, "courseId", title, description, status, "dueDate")
     VALUES ($1, $2, 'Prototype Proposal', 'Propose a real-world problem and your prototype approach.', 'PUBLISHED', now() + interval '14 days')`,
    [assignmentId, courseId]
  );

  const projectId = id("prj_");
  await pool.query(
    `INSERT INTO "Project" (id, title, summary, "problemStatement", "ownerId", "assignmentId")
     VALUES ($1, 'BoaMe', 'A Ghanaian micro-donation and community assistance platform.', 'Communities lack fast, trusted tools for peer-to-peer assistance.', $2, $3)`,
    [projectId, student1Id, assignmentId]
  );

  const milestones = [
    "Define problem & scope",
    "Design architecture",
    "Build core prototype",
    "Test & iterate",
    "Present & document",
  ];
  for (let i = 0; i < milestones.length; i++) {
    await pool.query(
      `INSERT INTO "Milestone" (id, "projectId", title, "ownerId", "order", status)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id("mls_"), projectId, milestones[i], student1Id, i, i === 0 ? "DONE" : "PENDING"]
    );
  }

  console.log("Seed complete. Demo accounts (password: password123):");
  console.log("  Lecturer: lecturer@protolab.dev");
  console.log("  Student:  student1@protolab.dev");
  console.log("  Student:  student2@protolab.dev");
  await pool.end();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
