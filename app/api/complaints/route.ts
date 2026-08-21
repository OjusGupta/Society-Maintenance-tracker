import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/middleware-helper";
import { uploadImage } from "@/lib/cloudinary";

const CreateComplaintSchema = z.object({
  category: z.enum(["PLUMBING","ELECTRICAL","CLEANING","SECURITY","LIFT","PARKING","INTERNET","OTHER"]),
  description: z.string().min(10),
  photoBase64: z.string().optional(), // base64 data URI
});

// ─── GET /api/complaints ───────────────────────────────────────────────────────
// Resident: returns own complaints
// Admin:    returns all complaints, supports ?status=&category=&date= filters + overdue sorting
export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;

  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get("status");
  const categoryFilter = searchParams.get("category");
  const dateFilter = searchParams.get("date");

  const thresholdDays = parseInt(process.env.OVERDUE_THRESHOLD_DAYS ?? "7", 10);
  const overdueDate = new Date(Date.now() - thresholdDays * 86400000);

  const where: Record<string, unknown> = {};

  // Residents only see their own
  if (user.role === "RESIDENT") {
    where.residentId = user.userId;
  }

  if (statusFilter) where.currentStatus = statusFilter;
  if (categoryFilter) where.category = categoryFilter;
  if (dateFilter) {
    const d = new Date(dateFilter);
    where.createdAt = { gte: d, lt: new Date(d.getTime() + 86400000) };
  }

  const complaints = await prisma.complaint.findMany({
    where,
    include: {
      resident: { select: { id: true, name: true, email: true, flatNumber: true } },
      statusHistory: { orderBy: { timestamp: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Annotate each complaint with computed is_overdue
  const result = complaints.map((c) => ({
    ...c,
    isOverdue: c.currentStatus !== "RESOLVED" && c.createdAt < overdueDate,
  }));

  // Admin: sort overdue complaints to top
  if (user.role === "ADMIN") {
    result.sort((a, b) => Number(b.isOverdue) - Number(a.isOverdue));
  }

  return NextResponse.json(result);
}

// ─── POST /api/complaints ──────────────────────────────────────────────────────
// Resident only: raise a new complaint, optionally with a photo
export async function POST(req: NextRequest) {
  const auth = requireAuth(req, "RESIDENT");
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;

  try {
    const body = await req.json();
    const parsed = CreateComplaintSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { category, description, photoBase64 } = parsed.data;

    let photoUrl: string | undefined;
    if (photoBase64) {
      const uploaded = await uploadImage(photoBase64);
      photoUrl = uploaded ? uploaded : undefined;
    }

    const complaint = await prisma.$transaction(async (tx) => {
      const c = await tx.complaint.create({
        data: {
          residentId: user.userId,
          category,
          description,
          photoUrl,
          currentStatus: "OPEN",
          priority: "LOW",
        },
      });
      // Insert initial OPEN status into history
      await tx.complaintStatusHistory.create({
        data: {
          complaintId: c.id,
          status: "OPEN",
          changedById: user.userId,
          note: "Complaint raised",
        },
      });
      return c;
    });

    return NextResponse.json(complaint, { status: 201 });
  } catch (err) {
    console.error("[POST /api/complaints]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
