import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";
import "dotenv/config";
import ws from "ws";

neonConfig.webSocketConstructor = ws;
const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database…");

  // ─── Demo Admin ───────────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@society.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@society.com",
      passwordHash: adminHash,
      role: "ADMIN",
    },
  });
  console.log("✓ Admin:", admin.email);

  // ─── Demo Resident ────────────────────────────────────────────────────────
  const residentHash = await bcrypt.hash("resident123", 12);
  const resident = await prisma.user.upsert({
    where: { email: "resident@society.com" },
    update: {},
    create: {
      name: "Ravi Sharma",
      email: "resident@society.com",
      passwordHash: residentHash,
      role: "RESIDENT",
      flatNumber: "A-204",
    },
  });
  console.log("✓ Resident:", resident.email);

  // ─── Sample complaint 1 (IN_PROGRESS) ────────────────────────────────────
  await prisma.complaint.upsert({
    where: { id: "seed-complaint-1" },
    update: {},
    create: {
      id: "seed-complaint-1",
      residentId: resident.id,
      category: "PLUMBING",
      description: "Water leakage from kitchen sink pipe. Water is dripping constantly and has damaged the cabinet below.",
      priority: "HIGH",
      currentStatus: "IN_PROGRESS",
      createdAt: new Date(Date.now() - 3 * 86400000),
    },
  });

  await prisma.complaintStatusHistory.upsert({
    where: { id: "seed-hist-1a" },
    update: {},
    create: { id: "seed-hist-1a", complaintId: "seed-complaint-1", status: "OPEN", changedById: resident.id, note: "Complaint raised", timestamp: new Date(Date.now() - 3 * 86400000) },
  });

  await prisma.complaintStatusHistory.upsert({
    where: { id: "seed-hist-1b" },
    update: {},
    create: { id: "seed-hist-1b", complaintId: "seed-complaint-1", status: "IN_PROGRESS", changedById: admin.id, note: "Plumber dispatched, will arrive tomorrow", timestamp: new Date(Date.now() - 1 * 86400000) },
  });

  // ─── Sample complaint 2 (OPEN + OVERDUE — 10 days old) ───────────────────
  await prisma.complaint.upsert({
    where: { id: "seed-complaint-2" },
    update: {},
    create: {
      id: "seed-complaint-2",
      residentId: resident.id,
      category: "ELECTRICAL",
      description: "Street light on Block B path has been non-functional for 2 weeks. Residents face difficulty at night.",
      priority: "MEDIUM",
      currentStatus: "OPEN",
      createdAt: new Date(Date.now() - 10 * 86400000),
    },
  });

  await prisma.complaintStatusHistory.upsert({
    where: { id: "seed-hist-2a" },
    update: {},
    create: { id: "seed-hist-2a", complaintId: "seed-complaint-2", status: "OPEN", changedById: resident.id, note: "Complaint raised", timestamp: new Date(Date.now() - 10 * 86400000) },
  });

  // ─── Sample complaint 3 (RESOLVED) ───────────────────────────────────────
  await prisma.complaint.upsert({
    where: { id: "seed-complaint-3" },
    update: {},
    create: {
      id: "seed-complaint-3",
      residentId: resident.id,
      category: "CLEANING",
      description: "Common area on 3rd floor not cleaned for a week.",
      priority: "LOW",
      currentStatus: "RESOLVED",
      createdAt: new Date(Date.now() - 8 * 86400000),
      resolvedAt: new Date(Date.now() - 2 * 86400000),
    },
  });

  await prisma.complaintStatusHistory.upsert({
    where: { id: "seed-hist-3a" },
    update: {},
    create: { id: "seed-hist-3a", complaintId: "seed-complaint-3", status: "OPEN", changedById: resident.id, note: "Complaint raised", timestamp: new Date(Date.now() - 8 * 86400000) },
  });

  await prisma.complaintStatusHistory.upsert({
    where: { id: "seed-hist-3b" },
    update: {},
    create: { id: "seed-hist-3b", complaintId: "seed-complaint-3", status: "IN_PROGRESS", changedById: admin.id, note: "Cleaning scheduled", timestamp: new Date(Date.now() - 5 * 86400000) },
  });

  await prisma.complaintStatusHistory.upsert({
    where: { id: "seed-hist-3c" },
    update: {},
    create: { id: "seed-hist-3c", complaintId: "seed-complaint-3", status: "RESOLVED", changedById: admin.id, note: "Area cleaned and verified.", timestamp: new Date(Date.now() - 2 * 86400000) },
  });

  console.log("✓ Sample complaints seeded");

  // ─── Sample notice ────────────────────────────────────────────────────────
  await prisma.notice.upsert({
    where: { id: "seed-notice-1" },
    update: {},
    create: {
      id: "seed-notice-1",
      title: "Water Supply Interruption — Friday 6AM–10AM",
      body: "Dear residents,\n\nDue to maintenance of the overhead tank, water supply will be interrupted this Friday from 6:00 AM to 10:00 AM. Please store water in advance.\n\nApologies for the inconvenience.",
      isImportant: true,
      postedById: admin.id,
    },
  });
  console.log("✓ Sample notice seeded");

  console.log("\n✅ Seed complete!");
  console.log("   Admin login:    admin@society.com     / admin123");
  console.log("   Resident login: resident@society.com  / resident123");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
