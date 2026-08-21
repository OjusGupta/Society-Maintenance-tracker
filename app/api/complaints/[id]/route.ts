import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/middleware-helper";

// ─── GET /api/complaints/[id] ─────────────────────────────────────────────────
// Returns complaint detail + full status history timeline
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;

  const { id } = await params;

  const complaint = await prisma.complaint.findUnique({
    where: { id },
    include: {
      resident: { select: { id: true, name: true, email: true, flatNumber: true } },
      statusHistory: {
        include: { changedBy: { select: { id: true, name: true, role: true } } },
        orderBy: { timestamp: "asc" },
      },
    },
  });

  if (!complaint) {
    return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
  }

  // Residents can only view their own complaints
  if (user.role === "RESIDENT" && complaint.residentId !== user.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const thresholdDays = parseInt(process.env.OVERDUE_THRESHOLD_DAYS ?? "7", 10);
  const overdueDate = new Date(Date.now() - thresholdDays * 86400000);
  const isOverdue = complaint.currentStatus !== "RESOLVED" && complaint.createdAt < overdueDate;

  return NextResponse.json({ ...complaint, isOverdue });
}

// ─── DELETE /api/complaints/[id] ──────────────────────────────────────────────
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;

  const { id } = await params;

  const complaint = await prisma.complaint.findUnique({
    where: { id },
  });

  if (!complaint) {
    return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
  }

  // Residents can only delete their own complaints
  if (user.role === "RESIDENT" && complaint.residentId !== user.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Delete complaint (status history will be deleted if onCascade is set, else we need to delete it first)
  await prisma.$transaction(async (tx) => {
    await tx.complaintStatusHistory.deleteMany({ where: { complaintId: id } });
    await tx.complaint.delete({ where: { id } });
  });

  return NextResponse.json({ success: true });
}
