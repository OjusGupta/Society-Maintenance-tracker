import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/middleware-helper";
import { sendImportantNoticeEmail } from "@/lib/email";

const NoticeSchema = z.object({
  title: z.string().min(3),
  body: z.string().min(10),
  isImportant: z.boolean().default(false),
});

// ─── GET /api/notices ──────────────────────────────────────────────────────────
// Authenticated: returns all notices, important ones pinned to top
export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const notices = await prisma.notice.findMany({
    include: { postedBy: { select: { id: true, name: true } } },
    orderBy: [{ isImportant: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(notices);
}

// ─── POST /api/notices ─────────────────────────────────────────────────────────
// Admin only: create a notice; if important, emails all residents
export async function POST(req: NextRequest) {
  const auth = requireAuth(req, "ADMIN");
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;

  try {
    const body = await req.json();
    const parsed = NoticeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { title, body: noticeBody, isImportant } = parsed.data;

    const notice = await prisma.notice.create({
      data: { title, body: noticeBody, isImportant, postedById: user.userId },
    });

    // Fire-and-forget email to all residents if notice is important
    if (isImportant) {
      const residents = await prisma.user.findMany({
        where: { role: "RESIDENT" },
        select: { email: true },
      });

      for (const r of residents) {
        sendImportantNoticeEmail({
          to: r.email,
          title,
          body: noticeBody,
          noticeId: notice.id,
        });
      }
    }

    return NextResponse.json(notice, { status: 201 });
  } catch (err) {
    console.error("[POST /api/notices]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
