import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { getSettings, updateSettings } from "@/lib/settings";

const payloadSchema = z.object({
  minimumQuality: z.number().min(0).max(100),
  indicatorSensitivity: z.number().min(0.1).max(5),
});

export async function GET() {
  const settings = await getSettings();
  return NextResponse.json({ settings });
}

export async function PUT(request: Request) {
  const session = (await (getServerSession as unknown as (
    ...args: unknown[]
  ) => Promise<Session | null>)(authOptions)) as Session | null;
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const settings = await updateSettings(parsed.data);
  return NextResponse.json({ settings });
}
