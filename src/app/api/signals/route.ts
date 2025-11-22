import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";

import { authOptions } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { generateAndStoreSignals } from "@/lib/signal-engine";
import { getRecentSignals } from "@/lib/signals";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? 20);

  const signals = await getRecentSignals(
    Number.isFinite(limit) ? Math.min(limit, 100) : 20,
  );

  return NextResponse.json({ signals });
}

export async function POST() {
  const session = (await (getServerSession as unknown as (
    ...args: unknown[]
  ) => Promise<Session | null>)(authOptions)) as Session | null;
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const settings = await getSettings();
  const generated = await generateAndStoreSignals({
    sensitivity: settings.indicatorSensitivity,
    minimumQuality: settings.minimumQuality,
  });

  return NextResponse.json({ generated });
}
