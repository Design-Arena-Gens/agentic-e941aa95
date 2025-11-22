import dayjs from "dayjs";
import type { Signal } from "@prisma/client";

import prisma from "./prisma";

export type SignalWithMetadata = Signal & {
  metadata: Record<string, unknown> | null;
};

export async function getRecentSignals(limit = 20): Promise<SignalWithMetadata[]> {
  const signals = await prisma.signal.findMany({
    orderBy: { generatedAt: "desc" },
    take: limit,
  });
  return signals.map((signal) => ({
    ...signal,
    metadata: signal.metadata ? safeParse(signal.metadata) : null,
  })) as SignalWithMetadata[];
}

export async function getActiveSignals() {
  const signals = await prisma.signal.findMany({
    where: {
      expiresAt: {
        gt: new Date(),
      },
    },
    orderBy: {
      generatedAt: "desc",
    },
  });
  return signals.map((signal) => ({
    ...signal,
    metadata: signal.metadata ? safeParse(signal.metadata) : null,
  })) as SignalWithMetadata[];
}

export async function getPairStates() {
  const signals = await prisma.signal.groupBy({
    by: ["pair", "trend"],
    _max: {
      generatedAt: true,
    },
  });

  return signals.map((signal) => ({
    pair: signal.pair,
    trend: signal.trend,
    lastUpdated: signal._max.generatedAt,
  }));
}

export async function purgeOldSignals(days = 7) {
  await prisma.signal.deleteMany({
    where: {
      generatedAt: {
        lt: dayjs().subtract(days, "day").toDate(),
      },
    },
  });
}

function safeParse(payload: string) {
  try {
    return JSON.parse(payload) as Record<string, unknown>;
  } catch {
    return null;
  }
}
