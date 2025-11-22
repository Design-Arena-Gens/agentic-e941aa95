import dayjs from "dayjs";

import { FOREX_PAIRS } from "./constants";
import {
  type Candle,
  fetchOneMinuteCandles,
} from "./market-data";
import { computeIndicators, resampleToFiveMinute } from "./indicators";
import prisma from "./prisma";

export type GeneratedSignal = {
  pair: string;
  direction: "BUY" | "SELL";
  rsi: number;
  macdHistogram: number;
  supportLevel?: number;
  resistanceLevel?: number;
  quality: number;
  trend: string;
  generatedAt: Date;
  expiresAt?: Date;
  metadata?: Record<string, unknown>;
};

type SignalEvaluationContext = {
  fiveMinuteCandles: Candle[];
  sensitivity: number;
  minimumQuality: number;
};

export async function generateAndStoreSignals(
  context: Omit<SignalEvaluationContext, "fiveMinuteCandles">,
): Promise<GeneratedSignal[]> {
  const results: GeneratedSignal[] = [];

  for (const { pair, symbol } of FOREX_PAIRS) {
    const oneMinuteCandles = await fetchOneMinuteCandles(symbol);
    if (oneMinuteCandles.length === 0) {
      continue;
    }

    const fiveMinuteCandles = resampleToFiveMinute(oneMinuteCandles);
    if (fiveMinuteCandles.length === 0) {
      continue;
    }

    const indicatorSnapshot = computeIndicators(fiveMinuteCandles);
    if (!indicatorSnapshot) {
      continue;
    }

    const signal = evaluateSignal(pair, fiveMinuteCandles, indicatorSnapshot, {
      fiveMinuteCandles,
      sensitivity: context.sensitivity,
      minimumQuality: context.minimumQuality,
    });

    if (!signal) {
      continue;
    }

    results.push(signal);
  }

  if (results.length === 0) {
    return [];
  }

  await prisma.$transaction([
    prisma.signal.deleteMany({
      where: {
        generatedAt: {
          lt: dayjs().subtract(7, "day").toDate(),
        },
      },
    }),
    prisma.signal.createMany({
      data: results.map((signal) => ({
        pair: signal.pair,
        direction: signal.direction,
        rsi: signal.rsi,
        macdHistogram: signal.macdHistogram,
        supportLevel: signal.supportLevel,
        resistanceLevel: signal.resistanceLevel,
        trend: signal.trend,
        quality: signal.quality,
        generatedAt: signal.generatedAt,
        expiresAt: signal.expiresAt,
        metadata: signal.metadata ? JSON.stringify(signal.metadata) : null,
      })),
    }),
  ]);

  return results;
}

function evaluateSignal(
  pair: string,
  candles: Candle[],
  indicatorSnapshot: ReturnType<typeof computeIndicators>,
  context: SignalEvaluationContext,
): GeneratedSignal | null {
  if (!indicatorSnapshot) {
    return null;
  }

  const lastCandle = candles[candles.length - 1];
  const previousCandle = candles[candles.length - 2];
  const tolerance =
    Math.max(lastCandle.close * 0.001, 0.0005) / context.sensitivity;

  const rsiCrossUp =
    indicatorSnapshot.previousRsi < 30 && indicatorSnapshot.rsi >= 30;
  const rsiCrossDown =
    indicatorSnapshot.previousRsi > 70 && indicatorSnapshot.rsi <= 70;

  const macdCrossUp =
    indicatorSnapshot.previousMacdHistogram < 0 &&
    indicatorSnapshot.macdHistogram >= 0;
  const macdCrossDown =
    indicatorSnapshot.previousMacdHistogram > 0 &&
    indicatorSnapshot.macdHistogram <= 0;

  const touchesSupport =
    indicatorSnapshot.supportLevel !== undefined &&
    lastCandle.low <= indicatorSnapshot.supportLevel + tolerance;

  const touchesResistance =
    indicatorSnapshot.resistanceLevel !== undefined &&
    lastCandle.high >= indicatorSnapshot.resistanceLevel - tolerance;

  const bullishConfirmations = [
    rsiCrossUp,
    macdCrossUp,
    touchesSupport,
  ].filter(Boolean).length;

  const bearishConfirmations = [
    rsiCrossDown,
    macdCrossDown,
    touchesResistance,
  ].filter(Boolean).length;

  const trendBias =
    indicatorSnapshot.trend === "BULLISH"
      ? 10
      : indicatorSnapshot.trend === "BEARISH"
        ? -10
        : 0;

  const baseQuality = Math.max(bullishConfirmations, bearishConfirmations) * 30;

  const momentumQuality =
    indicatorSnapshot.macdHistogram -
    indicatorSnapshot.previousMacdHistogram;

  const computedQuality = Math.round(
    baseQuality +
      Math.min(Math.abs(momentumQuality) * 40, 20) +
      trendBias,
  );

  const direction =
    bullishConfirmations > bearishConfirmations
      ? "BUY"
      : bearishConfirmations > bullishConfirmations
        ? "SELL"
        : null;

  if (!direction) {
    return null;
  }

  if (computedQuality < context.minimumQuality) {
    return null;
  }

  const expiresAt = dayjs(lastCandle.timestamp).add(5, "minute").toDate();

  return {
    pair,
    direction,
    rsi: indicatorSnapshot.rsi,
    macdHistogram: indicatorSnapshot.macdHistogram,
    supportLevel: indicatorSnapshot.supportLevel,
    resistanceLevel: indicatorSnapshot.resistanceLevel,
    trend: indicatorSnapshot.trend,
    quality: Math.min(100, Math.max(0, computedQuality)),
    generatedAt: new Date(lastCandle.timestamp),
    expiresAt,
    metadata: {
      previousRsi: indicatorSnapshot.previousRsi,
      previousMacdHistogram: indicatorSnapshot.previousMacdHistogram,
      nextEntryTime: indicatorSnapshot.nextEntryTime.toISOString(),
      lastClose: lastCandle.close,
      previousClose: previousCandle.close,
    },
  };
}
