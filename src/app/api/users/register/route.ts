import { NextResponse } from "next/server";
import { hash } from "bcrypt";
import { z } from "zod";

import prisma from "@/lib/prisma";

const registerSchema = z.object({
  name: z.string().min(2).max(64),
  email: z.string().email(),
  password: z.string().min(6).max(128),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (existing) {
    return NextResponse.json(
      { error: "User already exists" },
      { status: 409 },
    );
  }

  const count = await prisma.user.count();
  const role = count === 0 ? "ADMIN" : "USER";
  const passwordHash = await hash(parsed.data.password, 10);

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      role,
    },
  });

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  });
}
