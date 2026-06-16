import type { Entry, Settings } from "./db";
import { reminderActive } from "./time";

// Build the live sequence of pebbles for "right now". Reminders outside their
// time window drop out; weight expands an entry into multiple slots so a
// favourite photo surfaces more often; shuffle interleaves so the same type
// doesn't clump. Strict order honours the composed sequence exactly.
export function buildPlaylist(entries: Entry[], settings: Settings, now: Date): Entry[] {
  const live = entries
    .filter((e) => e.active)
    .filter((e) => reminderActive(e, now))
    .sort((a, b) => a.order - b.order);

  if (live.length === 0) return [];

  if (!settings.shuffle) return live;

  // Weighted, declustered shuffle. Expand by weight, deal a deterministic-ish
  // shuffle (no Math.random reliance for reproducibility within a render), then
  // greedily space out repeats and same-type neighbours.
  const pool: Entry[] = [];
  live.forEach((e) => {
    const w = Math.max(1, Math.min(3, e.weight || 1));
    for (let i = 0; i < w; i++) pool.push(e);
  });

  const shuffled = seededShuffle(pool, hashSeed(now, live.length));
  return decluster(shuffled);
}

// Avoid the same entry — and, softly, the same type — landing back to back.
function decluster(items: Entry[]): Entry[] {
  const out: Entry[] = [];
  const remaining = [...items];
  while (remaining.length) {
    let idx = remaining.findIndex((e) => {
      const prev = out[out.length - 1];
      return !prev || e.id !== prev.id;
    });
    if (idx === -1) idx = 0;
    // nudge away from same-type clumps when an easy alternative exists
    const prev = out[out.length - 1];
    if (prev) {
      const alt = remaining.findIndex(
        (e, i) => i !== idx && e.id !== prev.id && e.type !== prev.type,
      );
      if (alt !== -1 && remaining[idx].type === prev.type) idx = alt;
    }
    out.push(remaining[idx]);
    remaining.splice(idx, 1);
  }
  return out;
}

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  let s = seed >>> 0;
  const rand = () => {
    // xorshift32 — small, no globals, stable for a given seed
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Reshuffle roughly every few minutes so a long-idle display slowly re-deals,
// but never mid-cycle.
function hashSeed(now: Date, n: number): number {
  const bucket = Math.floor(now.getTime() / (4 * 60_000));
  return (bucket * 2654435761 + n * 40503) >>> 0;
}
