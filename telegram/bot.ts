import "dotenv/config";
import axios from "axios";
import { Telegraf } from "telegraf";

type SignalPayload = {
  id: string;
  pair: string;
  direction: "BUY" | "SELL";
  quality: number;
  rsi: number;
  macdHistogram: number;
  generatedAt: string;
  metadata?: Record<string, unknown>;
};

const token = process.env.TELEGRAM_BOT_TOKEN;
const defaultChatId = process.env.TELEGRAM_CHAT_ID;
const apiBaseUrl =
  process.env.SIGNAL_API_BASE_URL ?? "http://localhost:3000/api";

if (!token) {
  throw new Error("TELEGRAM_BOT_TOKEN is required");
}

const bot = new Telegraf(token);

bot.start((ctx) => {
  ctx.reply(
    [
      "🚀 Welcome to Binary Options Signal Bot!",
      "",
      "Use /signals to retrieve the latest trade opportunities.",
      "Use /subscribe to set this chat as the default broadcast channel.",
    ].join("\n"),
  );
});

bot.command("signals", async (ctx) => {
  try {
    const signals = await fetchSignals();
    if (signals.length === 0) {
      await ctx.reply("No active signals at the moment. Check back soon.");
      return;
    }

    const message = signals
      .slice(0, 5)
      .map((signal) => formatSignal(signal))
      .join("\n\n");

    await ctx.reply(message, { parse_mode: "Markdown" });
  } catch (error) {
    console.error(error);
    ctx.reply("Unable to fetch signals. Please try again later.");
  }
});

bot.command("subscribe", async (ctx) => {
  if (!ctx.chat?.id) {
    ctx.reply("Oops, cannot determine chat id for subscription.");
    return;
  }

  process.env.TELEGRAM_CHAT_ID = String(ctx.chat.id);
  await ctx.reply(
    `✅ Subscribed this chat (${ctx.chat.id}) for manual broadcasts.`,
  );
});

bot.command("broadcast", async (ctx) => {
  try {
    const signals = await fetchSignals();
    if (signals.length === 0) {
      await ctx.reply("No signals to broadcast.");
      return;
    }
    const message = signals.map((signal) => formatSignal(signal)).join("\n\n");
    const targetChatId = defaultChatId ?? ctx.chat?.id;
    if (!targetChatId) {
      await ctx.reply("Define TELEGRAM_CHAT_ID to enable broadcasting.");
      return;
    }
    await ctx.telegram.sendMessage(targetChatId, message, {
      parse_mode: "Markdown",
    });
    await ctx.reply("Broadcast dispatched.");
  } catch (error) {
    console.error(error);
    ctx.reply("Failed to broadcast signals.");
  }
});

bot.launch().then(() => {
  console.log("Telegram bot is running");
});

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

async function fetchSignals(): Promise<SignalPayload[]> {
  const response = await axios.get<{ signals: SignalPayload[] }>(
    `${apiBaseUrl}/signals?limit=10`,
  );
  return response.data.signals;
}

function formatSignal(signal: SignalPayload) {
  const nextEntry =
    (signal.metadata?.nextEntryTime as string | undefined) ?? null;
  return [
    `*${signal.pair}* • ${signal.direction === "BUY" ? "🟢 BUY" : "🔴 SELL"}`,
    `Quality: *${signal.quality}%*`,
    `RSI: ${signal.rsi.toFixed(2)} • MACD: ${signal.macdHistogram.toFixed(4)}`,
    `Generated: ${new Date(signal.generatedAt).toUTCString()}`,
    nextEntry ? `Next entry window: ${new Date(nextEntry).toUTCString()}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}
