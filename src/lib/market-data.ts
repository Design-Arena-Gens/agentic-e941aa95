import axios from "axios";

import { DEFAULT_SIGNAL_LOOKBACK_MINUTES } from "./constants";

export type Candle = {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

const YAHOO_CHART_URL = "https://query1.finance.yahoo.com/v8/finance/chart";

export async function fetchOneMinuteCandles(
  symbol: string,
  minutes: number = DEFAULT_SIGNAL_LOOKBACK_MINUTES,
): Promise<Candle[]> {
  const safeRange = minutes <= 60 ? "1h" : minutes <= 720 ? "12h" : "1d";
  const url = `${YAHOO_CHART_URL}/${encodeURIComponent(
    symbol,
  )}?interval=1m&range=${safeRange}`;

  const response = await axios.get(url, {
    timeout: 10_000,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });

  const result = response.data?.chart?.result?.[0];
  if (!result || !result.timestamp || !result.indicators?.quote?.[0]) {
    return [];
  }

  const { timestamp } = result;
  const quote = result.indicators.quote[0];

  const candles: Candle[] = timestamp
    .map((time: number, index: number) => ({
      timestamp: time * 1000,
      open: Number(quote.open?.[index] ?? 0),
      high: Number(quote.high?.[index] ?? 0),
      low: Number(quote.low?.[index] ?? 0),
      close: Number(quote.close?.[index] ?? 0),
      volume: Number(quote.volume?.[index] ?? 0),
    }))
    .filter((candle: Candle) => Number.isFinite(candle.close));

  const cutoff = Date.now() - minutes * 60_000;

  return candles.filter((candle) => candle.timestamp >= cutoff);
}
