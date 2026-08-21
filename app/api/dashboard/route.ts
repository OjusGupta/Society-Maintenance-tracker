import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/middleware-helper";

// ─── GET /api/dashboard ───────────────────────────────────────────────────────
// Admin only: summary counts by status, by category, and overdue count
export async function GET(req: NextRequest) {
  const auth = requireAuth(req, "ADMIN");
  if (auth instanceof NextResponse) return auth;

  const thresholdDays = parseInt(process.env.OVERDUE_THRESHOLD_DAYS ?? "7", 10);
  const overdueDate = new Date(Date.now() - thresholdDays * 86400000);

  const [byStatus, byCategory, overdueCount, total, recentComplaints] = await Promise.all([
    // Count by status
    prisma.complaint.groupBy({ by: ["currentStatus"], _count: true }),
    // Count by category
    prisma.complaint.groupBy({ by: ["category"], _count: true }),
    // Overdue: open/in-progress and older than threshold
    prisma.complaint.count({
      where: {
        currentStatus: { not: "RESOLVED" },
        createdAt: { lt: overdueDate },
      },
    }),
    // Total complaints
    prisma.complaint.count(),
    // 5 most recent complaints for quick view
    prisma.complaint.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { resident: { select: { name: true, flatNumber: true } } },
    }),
  ]);

  return NextResponse.json({
    total,
    overdueCount,
    byStatus: byStatus.map((r) => ({ status: r.currentStatus, count: r._count })),
    byCategory: byCategory.map((r) => ({ category: r.category, count: r._count })),
    recentComplaints,
    thresholdDays,
  });
}
