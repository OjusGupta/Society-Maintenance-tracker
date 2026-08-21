import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/middleware-helper";
import { sendStatusChangeEmail } from "@/lib/email";

const StatusSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED"]),
  note: z.string().optional(),
});

// ─── PATCH /api/complaints/[id]/status ────────────────────────────────────────
// Admin only: update complaint status, append to history, send email (fire-and-forget)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(req, "ADMIN");
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;

  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = StatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { status, note } = parsed.data;

    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: { resident: true },
    });

    if (!complaint) {
      return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
    }

    // Once resolved, no further changes allowed
    if (complaint.currentStatus === "RESOLVED") {
      return NextResponse.json({ error: "Resolved complaints cannot be modified" }, { status: 400 });
    }

    // Perform DB update + history insert in a transaction
    const updated = await prisma.$transaction(async (tx) => {
      const c = await tx.complaint.update({
        where: { id },
        data: {
          currentStatus: status,
          resolvedAt: status === "RESOLVED" ? new Date() : undefined,
        },
      });
      await tx.complaintStatusHistory.create({
        data: {
          complaintId: id,
          status,
          note,
          changedById: user.userId,
        },
      });
      return c;
    });

    // Fire-and-forget email — does NOT await inside try/catch on purpose
    sendStatusChangeEmail({
      to: complaint.resident.email,
      residentName: complaint.resident.name,
      complaintId: id,
      category: complaint.category,
      newStatus: status,
      note,
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PATCH /status]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
