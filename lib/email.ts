import { Resend } from "resend";
import { prisma } from "./prisma";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "Society Tracker <onboarding@resend.dev>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// ─── Status Change Email ───────────────────────────────────────────────────────
export async function sendStatusChangeEmail({
  to,
  residentName,
  complaintId,
  category,
  newStatus,
  note,
}: {
  to: string;
  residentName: string;
  complaintId: string;
  category: string;
  newStatus: string;
  note?: string | null;
}) {
  const statusLabel = newStatus.replace("_", " ");
  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: `Complaint Update: ${category} is now ${statusLabel}`,
      html: `
        <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
          <h2 style="color:#6366f1;">Society Maintenance Tracker</h2>
          <p>Hi ${residentName},</p>
          <p>Your <strong>${category}</strong> complaint status has been updated to <strong>${statusLabel}</strong>.</p>
          ${note ? `<p><em>Note from admin: ${note}</em></p>` : ""}
          <a href="${APP_URL}/complaints/${complaintId}" 
             style="display:inline-block;background:#6366f1;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:12px;">
            View Complaint
          </a>
          <p style="color:#94a3b8;font-size:12px;margin-top:24px;">Society Maintenance Tracker</p>
        </div>
      `,
    });
    await logEmail(to, "STATUS_CHANGE", "SENT");
  } catch (err) {
    console.error("[Email] Status change email failed:", err);
    await logEmail(to, "STATUS_CHANGE", "FAILED", String(err));
  }
}

// ─── Important Notice Email ────────────────────────────────────────────────────
export async function sendImportantNoticeEmail({
  to,
  title,
  body,
  noticeId,
}: {
  to: string;
  title: string;
  body: string;
  noticeId: string;
}) {
  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: `📢 Important Notice: ${title}`,
      html: `
        <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
          <h2 style="color:#f59e0b;">📢 ${title}</h2>
          <p>${body}</p>
          <a href="${APP_URL}/notices" 
             style="display:inline-block;background:#f59e0b;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:12px;">
            View Notice Board
          </a>
          <p style="color:#94a3b8;font-size:12px;margin-top:24px;">Society Maintenance Tracker</p>
        </div>
      `,
    });
    await logEmail(to, "IMPORTANT_NOTICE", "SENT");
  } catch (err) {
    console.error("[Email] Important notice email failed:", err);
    await logEmail(to, "IMPORTANT_NOTICE", "FAILED", String(err));
  }
}

async function logEmail(
  recipient: string,
  type: "STATUS_CHANGE" | "IMPORTANT_NOTICE",
  status: "SENT" | "FAILED",
  error?: string
) {
  try {
    await prisma.emailLog.create({
      data: { recipient, type, status, error },
    });
  } catch {
    // Don't let log failure crash anything
  }
}
