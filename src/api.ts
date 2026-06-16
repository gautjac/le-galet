import type { Lang } from "./i18n";

export interface GreetingCard {
  text: string;
  note: string; // a one-line reason it fits the season/day
}

export interface QuoteSuggestion {
  text: string;
  author: string;
  windowLabel: string; // human label for the suggested time window, e.g. "matins d'hiver"
}

export interface SouffleurResult {
  greetings: GreetingCard[];
  quotes: QuoteSuggestion[];
}

export interface SouffleurRequest {
  lang: Lang;
  season: string;
  dateLabel: string; // a friendly date string in the display language
  tone: string; // the household's mood, from settings
  existing: string[]; // a few existing quotes/greetings, so it doesn't repeat
}

/**
 * The Souffleur runs an Opus call with forced tool-use; that can take ~25–45s,
 * longer than Netlify's synchronous idle timeout. The function streams NDJSON —
 * bare-newline heartbeats keep the socket warm, then a final JSON line carries
 * { result } or { error }. We read to end-of-stream and parse the last line.
 */
export async function fetchSouffle(req: SouffleurRequest): Promise<SouffleurResult> {
  const en = req.lang === "en";
  const res = await fetch("/api/souffleur", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });

  const raw = await res.text();
  const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
  const last = lines[lines.length - 1] ?? "";

  let parsed: { result?: SouffleurResult; error?: string } | null = null;
  try {
    parsed = last ? JSON.parse(last) : null;
  } catch {
    parsed = null;
  }

  const invalid = en ? "Invalid response from the server." : "Réponse invalide du serveur.";

  if (!res.ok) {
    const fallback = en ? `Error ${res.status}` : `Erreur ${res.status}`;
    throw new Error(parsed?.error || fallback);
  }
  if (!parsed) throw new Error(invalid);
  if (parsed.error) throw new Error(parsed.error);
  if (parsed.result) return parsed.result;
  throw new Error(invalid);
}
