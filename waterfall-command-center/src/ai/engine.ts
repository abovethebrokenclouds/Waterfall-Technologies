/**
 * ai/engine.ts
 * ----------------------------------------------------------------------------
 * The bridge between "skills" and an actual language model, plus the small text
 * utilities every local generator uses.
 *
 * DESIGN: The Command Center runs FULLY OFFLINE by default. Every skill ships a
 * deterministic, template-based generator so the whole app is demoable with
 * zero setup and no API keys. When you are ready to use a real model, you flip a
 * single switch (an env var) and the same skills route their free-text fields
 * through your model — falling back to the local generator on any error.
 *
 * ───────────────────────── HOW TO PLUG IN A REAL MODEL ──────────────────────
 * 1. Stand up an endpoint that accepts  POST { system?, prompt }  and returns
 *    { text: string }. A Supabase Edge Function or any /api/generate route works.
 *    (You can call Claude, OpenAI, etc. from inside that endpoint so your key
 *    never ships to the browser.)
 * 2. In Lovable: Project Settings → Environment, set:
 *       VITE_AI_API_URL = https://<your-endpoint>
 *       VITE_AI_API_KEY = <optional bearer token>
 * 3. Done. Skills now use the live model and degrade gracefully if it's down.
 * ----------------------------------------------------------------------------
 */

export interface ModelRequest {
  /** System / role instruction for the model. */
  system?: string;
  /** The user prompt. */
  prompt: string;
}

/** Is a real model endpoint configured? Used to show status in the UI. */
export function isModelConfigured(): boolean {
  return Boolean(import.meta.env.VITE_AI_API_URL);
}

/**
 * Ask the configured model for text. If no endpoint is configured (or it fails),
 * we transparently return the local `fallback()` so the feature still works.
 */
export async function callModel(
  req: ModelRequest,
  fallback: () => string,
): Promise<string> {
  const url = import.meta.env.VITE_AI_API_URL as string | undefined;
  if (!url) return fallback();

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(import.meta.env.VITE_AI_API_KEY
          ? { Authorization: `Bearer ${import.meta.env.VITE_AI_API_KEY}` }
          : {}),
      },
      body: JSON.stringify(req),
    });
    if (!res.ok) throw new Error(`Model API responded ${res.status}`);
    const data = await res.json();
    const text = (data.text ?? data.output ?? "").toString().trim();
    return text || fallback();
  } catch (err) {
    // Never break the UI because the model is unavailable.
    console.warn("[ai] callModel failed — using local generator:", err);
    return fallback();
  }
}

/** Simulate a little latency so local generation feels like a real call. */
export function pause(ms = 450): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/* -------------------------------------------------------------------------- */
/*  Tiny text helpers shared by the local generators                          */
/* -------------------------------------------------------------------------- */

export const titleCase = (s: string): string =>
  s.replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase());

/** Deterministically pick an item from a list based on a seed string. */
export function seededPick<T>(list: T[], seed: string): T {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return list[h % list.length];
}

/** A stable, readable id for new records. */
export function uid(prefix = "id"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

/** Today as an ISO date (yyyy-mm-dd). */
export const today = (): string => new Date().toISOString().slice(0, 10);

/** Add days to a date and return ISO date string. */
export function addDays(dateISO: string, days: number): string {
  const d = new Date(dateISO);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
