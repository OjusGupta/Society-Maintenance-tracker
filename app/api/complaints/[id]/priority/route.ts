import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/middleware-helper";

const PrioritySchema = z.object({
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
});

// ─── PATCH /api/complaints/[id]/priority ──────────────────────────────────────
// Admin only: set complaint priority
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(req, "ADMIN");
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = PrioritySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const complaint = await prisma.complaint.findUnique({ where: { id } });
    if (!complaint) {
      return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
    }

    if (complaint.currentStatus === "RESOLVED") {
      return NextResponse.json({ error: "Cannot change priority of a resolved complaint" }, { status: 400 });
    }

    const updated = await prisma.complaint.update({
      where: { id },
      data: { priority: parsed.data.priority },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PATCH /priority]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
