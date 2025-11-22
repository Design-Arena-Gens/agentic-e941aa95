"use client";

import { useState } from "react";
import { format } from "date-fns";

import type { SettingsPayload } from "@/lib/settings";
import type { SignalWithMetadata } from "@/lib/signals";

type Props = {
  settings: SettingsPayload;
  recentSignals: SignalWithMetadata[];
};

export default function AdminPanel({ settings, recentSignals }: Props) {
  const [minimumQuality, setMinimumQuality] = useState(
    settings.minimumQuality,
  );
  const [indicatorSensitivity, setIndicatorSensitivity] = useState(
    settings.indicatorSensitivity,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSaveSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          minimumQuality,
          indicatorSensitivity,
        }),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error ?? "Failed to update settings");
      }

      setMessage("Settings saved successfully.");
    } catch (savingError) {
      setError(
        savingError instanceof Error
          ? savingError.message
          : "Unable to save settings",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleGenerateSignals() {
    setIsGenerating(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/signals", {
        method: "POST",
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to generate signals");
      }

      setMessage(`Generated ${payload.generated.length} signals.`);
    } catch (generationError) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : "Unable to generate signals",
      );
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-white">Admin controls</h1>
        <p className="muted mt-2 text-sm">
          Fine-tune the signal engine and manually generate new binary options
          opportunities.
        </p>
      </header>

      <section className="card-surface">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Signal parameters</h2>
            <p className="muted text-sm">
              Adjust thresholds that govern quality filtering and sensitivity.
            </p>
          </div>
          <button
            type="button"
            onClick={handleGenerateSignals}
            disabled={isGenerating}
            className="mt-4 inline-flex items-center justify-center rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-cyan-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 disabled:cursor-not-allowed disabled:opacity-60 sm:mt-0"
          >
            {isGenerating ? "Running…" : "Generate signals now"}
          </button>
        </div>

        <form
          onSubmit={handleSaveSettings}
          className="mt-6 grid gap-6 md:grid-cols-2"
        >
          <fieldset className="space-y-2 rounded-xl border border-slate-800/70 bg-slate-950/60 p-4">
            <legend className="text-sm font-semibold text-slate-200">
              Minimum signal quality
            </legend>
            <p className="muted text-xs">
              Signals below this percentage threshold will be discarded.
            </p>
            <input
              type="range"
              min={30}
              max={100}
              value={minimumQuality}
              onChange={(event) => setMinimumQuality(Number(event.target.value))}
              className="w-full accent-cyan-500"
            />
            <div className="text-sm font-semibold text-cyan-300">
              {minimumQuality}%
            </div>
          </fieldset>

          <fieldset className="space-y-2 rounded-xl border border-slate-800/70 bg-slate-950/60 p-4">
            <legend className="text-sm font-semibold text-slate-200">
              Indicator sensitivity
            </legend>
            <p className="muted text-xs">
              Higher sensitivity tightens support/resistance proximity.
            </p>
            <input
              type="range"
              min={0.5}
              max={2}
              step={0.1}
              value={indicatorSensitivity}
              onChange={(event) =>
                setIndicatorSensitivity(Number(event.target.value))
              }
              className="w-full accent-cyan-500"
            />
            <div className="text-sm font-semibold text-cyan-300">
              ×{indicatorSensitivity.toFixed(1)}
            </div>
          </fieldset>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-lg bg-slate-800 px-5 py-2 text-sm font-medium text-white transition hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Saving…" : "Save configuration"}
            </button>
          </div>
        </form>

        {(message || error) && (
          <div
            className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
              message
                ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-200"
                : "border-rose-500/50 bg-rose-500/10 text-rose-200"
            }`}
          >
            {message ?? error}
          </div>
        )}
      </section>

      <section className="card-surface">
        <h2 className="text-lg font-semibold">Recent engine output</h2>
        <p className="muted mt-1 text-sm">
          Snapshot of the latest signals produced by the generator.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3 pr-6">Pair</th>
                <th className="py-3 pr-6">Direction</th>
                <th className="py-3 pr-6">Quality</th>
                <th className="py-3 pr-6">Generated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {recentSignals.map((signal) => (
                <tr key={signal.id}>
                  <td className="py-3 pr-6 font-medium text-slate-100">
                    {signal.pair}
                  </td>
                  <td className="py-3 pr-6">
                    <span
                      className={`rounded-lg px-3 py-1 text-xs font-semibold ${
                        signal.direction === "BUY"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-rose-500/20 text-rose-300"
                      }`}
                    >
                      {signal.direction}
                    </span>
                  </td>
                  <td className="py-3 pr-6 text-slate-200">
                    {signal.quality}%
                  </td>
                  <td className="py-3 pr-6 text-slate-400">
                      {format(new Date(signal.generatedAt), "MMM d, HH:mm:ss")}
                  </td>
                </tr>
              ))}
              {recentSignals.length === 0 && (
                <tr>
                  <td
                    className="py-6 text-center text-sm text-slate-400"
                    colSpan={4}
                  >
                    No signals yet. Generate to populate this table.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
