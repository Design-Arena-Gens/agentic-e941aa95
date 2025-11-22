import { NextResponse } from "next/server";

import { getSettings } from "@/lib/settings";
import { generateAndStoreSignals } from "@/lib/signal-engine";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = new URL(request.url).searchParams.get("secret");
    const headerSecret = request.headers.get("x-cron-secret");
    if (auth !== secret && headerSecret !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const settings = await getSettings();
  const generated = await generateAndStoreSignals({
    sensitivity: settings.indicatorSensitivity,
    minimumQuality: settings.minimumQuality,
  });

  return NextResponse.json({
    generated,
    count: generated.length,
  });
}
