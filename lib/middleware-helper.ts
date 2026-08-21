import { NextRequest, NextResponse } from "next/server";
import { verifyToken, extractToken, JWTPayload } from "@/lib/auth";

/**
 * Returns the decoded JWT payload from the Authorization header,
 * or responds with 401/403 if the token is missing/invalid/wrong role.
 *
 * Usage inside an API route:
 *   const user = await requireAuth(req);          // any authenticated user
 *   const user = await requireAuth(req, "ADMIN"); // admin only
 * If it returns a NextResponse, return it immediately from your route handler.
 */
export function requireAuth(
  req: NextRequest,
  role?: "ADMIN" | "RESIDENT"
): { user: JWTPayload } | NextResponse {
  const token = extractToken(req.headers.get("authorization"));
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }

  if (role && payload.role !== role) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return { user: payload };
}

export type AuthResult = ReturnType<typeof requireAuth>;
