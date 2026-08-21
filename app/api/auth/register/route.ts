import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";

const RegisterSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  flatNumber: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { name, email, password, flatNumber } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, passwordHash, flatNumber, role: "RESIDENT" },
    });

    const token = signToken({ userId: user.id, email: user.email, role: user.role, name: user.name });

    return NextResponse.json(
      { token, user: { id: user.id, name: user.name, email: user.email, role: user.role, flatNumber: user.flatNumber } },
      { status: 201 }
    );
  } catch (err) {
    console.error("[Register]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
