import { MACD, RSI } from "technicalindicators";

import type { Candle } from "./market-data";

export type IndicatorSnapshot = {
  rsi: number;
  previousRsi: number;
  macdHistogram: number;
  previousMacdHistogram: number;
  supportLevel?: number;
  resistanceLevel?: number;
  trend: "BULLISH" | "BEARISH" | "RANGE";
  nextEntryTime: Date;
};

export function resampleToFiveMinute(candles: Candle[]): Candle[] {
  if (candles.length === 0) {
    return [];
  }

  const sorted = [...candles].sort((a, b) => a.timestamp - b.timestamp);
  const bucketSizeMs = 5 * 60_000;
  const buckets = new Map<number, Candle[]>();

  for (const candle of sorted) {
    const bucketKey =
      Math.floor(candle.timestamp / bucketSizeMs) * bucketSizeMs;
    const collection = buckets.get(bucketKey) ?? [];
    collection.push(candle);
    buckets.set(bucketKey, collection);
  }

  const resampled: Candle[] = [];

  for (const [timestamp, bucket] of buckets.entries()) {
    const open = bucket[0]?.open ?? 0;
    const close = bucket[bucket.length - 1]?.close ?? 0;
    const high = bucket.reduce((max, item) => Math.max(max, item.high), open);
    const low = bucket.reduce((min, item) => Math.min(min, item.low), open);
    const volume = bucket.reduce((total, item) => total + item.volume, 0);

    resampled.push({ timestamp, open, high, low, close, volume });
  }

  return resampled.sort((a, b) => a.timestamp - b.timestamp);
}

export function computeIndicators(candles: Candle[]): IndicatorSnapshot | null {
  if (candles.length < 40) {
    return null;
  }

  const closes = candles.map((candle) => candle.close);

  const rsiSeries = RSI.calculate({
    period: 14,
    values: closes,
  });

  const macdSeries = MACD.calculate({
    values: closes,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  });

  if (rsiSeries.length < 2 || macdSeries.length < 2) {
    return null;
  }

  const lastRsi = rsiSeries[rsiSeries.length - 1];
  const previousRsi = rsiSeries[rsiSeries.length - 2];

  const lastMacd = macdSeries[macdSeries.length - 1];
  const previousMacd = macdSeries[macdSeries.length - 2];

  const lastCandle = candles[candles.length - 1];
  const previousCandle = candles[candles.length - 2];

  const { support, resistance, trend } = detectSupportResistance(candles);

  const nextEntryTime = new Date(lastCandle.timestamp + 5 * 60_000);

  return {
    rsi: lastRsi,
    previousRsi,
    macdHistogram: lastMacd.histogram ?? 0,
    previousMacdHistogram: previousMacd.histogram ?? 0,
    supportLevel: support,
    resistanceLevel: resistance,
    trend: trend ?? deriveTrend(lastCandle.close, previousCandle.close),
    nextEntryTime,
  };
}

function deriveTrend(
  lastClose: number,
  previousClose: number,
): "BULLISH" | "BEARISH" | "RANGE" {
  if (lastClose > previousClose) {
    return "BULLISH";
  }
  if (lastClose < previousClose) {
    return "BEARISH";
  }
  return "RANGE";
}

function detectSupportResistance(candles: Candle[]): {
  support?: number;
  resistance?: number;
  trend?: "BULLISH" | "BEARISH" | "RANGE";
} {
  const recent = candles.slice(-60);
  if (recent.length < 10) {
    return {};
  }

  let support: number | undefined;
  let resistance: number | undefined;

  const highs = recent.map((candle) => candle.high);
  const lows = recent.map((candle) => candle.low);

  const maxHigh = Math.max(...highs);
  const minLow = Math.min(...lows);

  const tolerance = (maxHigh - minLow) * 0.01;

  for (let i = lows.length - 2; i >= 2; i--) {
    const current = lows[i];
    if (current === 0) continue;
    if (current <= lows[i - 1] && current <= lows[i + 1]) {
      support = current;
      break;
    }
  }

  for (let i = highs.length - 2; i >= 2; i--) {
    const current = highs[i];
    if (current >= highs[i - 1] && current >= highs[i + 1]) {
      resistance = current;
      break;
    }
  }

  const closes = recent.map((candle) => candle.close);
  const firstClose = closes[0];
  const lastClose = closes[closes.length - 1];
  const change = lastClose - firstClose;

  let trend: "BULLISH" | "BEARISH" | "RANGE" = "RANGE";
  if (change > tolerance) {
    trend = "BULLISH";
  } else if (change < -tolerance) {
    trend = "BEARISH";
  }

  return { support, resistance, trend };
}
