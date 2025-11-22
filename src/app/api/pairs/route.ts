import { NextResponse } from "next/server";

import { FOREX_PAIRS } from "@/lib/constants";
import { getPairStates } from "@/lib/signals";

export async function GET() {
  const states = await getPairStates();
  const merged = FOREX_PAIRS.map((pair) => ({
    ...pair,
    trend:
      states.find((state) => state.pair === pair.pair)?.trend ?? "UNKNOWN",
    lastUpdated: states.find((state) => state.pair === pair.pair)
      ?.lastUpdated,
  }));
  return NextResponse.json({ pairs: merged });
}
