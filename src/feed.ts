// The margin-quotes feed.
//
// Quotes Jacques saves off a magazine's margin (the "Save to quotes" button in
// Les Marges) land in the vault at ~/Claude/wiki/quotes/*.md. A launchd job
// compiles them into /quotes-feed.json and pushes; Netlify redeploys. This module
// is the receiving end on the display: on load (and every few hours, since the
// kitchen iPad rarely reloads) it pulls the feed and imports anything new into
// the local Dexie store.
//
// Two rules keep it gentle:
//   1. Import only ids never seen before — so deleting a quote on the display
//      makes it stay gone; the next sync won't resurrect it.
//   2. Skip any quote whose text already exists locally — so a line typed by
//      hand (or imported under the old scheme) never doubles up.

import { db, addMarginQuote } from "./db";

interface FeedItem {
  id: string;
  text: string;
  author: string;
  source?: string;
}

const SEEN_KEY = "le-galet.feed-seen-ids";
const normKey = (t: string) => t.trim().toLowerCase().replace(/\s+/g, " ");

function loadSeen(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function saveSeen(seen: Set<string>): void {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...seen]));
  } catch {
    /* private mode / sandboxed storage — fine, we just re-check next load */
  }
}

export async function importQuoteFeed(): Promise<number> {
  let feed: FeedItem[];
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}quotes-feed.json`, { cache: "no-store" });
    if (!res.ok) return 0;
    feed = await res.json();
  } catch {
    return 0; // offline, or feed not deployed yet — silent, try again later
  }
  if (!Array.isArray(feed) || feed.length === 0) return 0;

  const seen = loadSeen();
  const fresh = feed.filter((q) => q && q.id && q.text && !seen.has(q.id));
  if (fresh.length === 0) return 0;

  // Guard against re-adding a line the household already has by some other route.
  const existing = await db.entries.where("type").equals("quote").toArray();
  const existingText = new Set(existing.map((e) => normKey(e.text)));

  let added = 0;
  for (const q of fresh) {
    const text = q.text.trim();
    const key = normKey(text);
    if (text && !existingText.has(key)) {
      await addMarginQuote(text, (q.author || "").trim());
      existingText.add(key);
      added++;
    }
    seen.add(q.id); // mark seen even if skipped, so we don't reconsider it
  }
  saveSeen(seen);
  return added;
}
