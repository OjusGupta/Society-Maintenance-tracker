import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/middleware-helper";

const OverdueSchema = z.object({
  isFlaggedOverdue: z.boolean(),
});

// ─── PATCH /api/complaints/[id]/overdue ───────────────────────────────────────
// Admin only: manually flag (or unflag) a complaint as overdue
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(req, "ADMIN");
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = OverdueSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const complaint = await prisma.complaint.findUnique({ where: { id } });
    if (!complaint) {
      return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
    }

    if (complaint.currentStatus === "RESOLVED") {
      return NextResponse.json({ error: "Cannot flag a resolved complaint as overdue" }, { status: 400 });
    }

    const updated = await prisma.complaint.update({
      where: { id },
      data: { isFlaggedOverdue: parsed.data.isFlaggedOverdue },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PATCH /overdue]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
