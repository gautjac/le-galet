import Dexie, { type Table } from "dexie";

// ── The rotation ──────────────────────────────────────────────────────────────
// One "pebble" of the slideshow. Everything that can appear on the display is an
// entry — a photo, a quote, or a time-aware reminder — so the engine iterates a
// single ordered, weighted, time-filtered list. Photo bytes live separately in
// `photos` (keyed by photoId) so reordering/weighting an entry never moves a blob.
export type EntryType = "photo" | "quote" | "reminder";

export interface Entry {
  id?: number;
  type: EntryType;
  text: string; // quote body, reminder text, or optional photo caption
  author: string; // quote attribution; "" otherwise
  photoId?: number; // → photos.id, for type === "photo"
  weight: number; // 1–3: how often this pebble surfaces in the shuffle
  order: number; // manual sort position (lower = earlier)
  // Reminder time window (epoch ms). When set, the entry only appears inside it.
  startAt?: number | null;
  endAt?: number | null;
  recurrence?: Recurrence;
  active: boolean; // soft on/off without deleting
  // provenance: typed by hand, kept from a Souffleur suggestion, or imported
  // from a quote saved off a magazine's margin (Les Marges → wiki → feed).
  source?: "hand" | "souffleur" | "margin";
  createdAt: number;
  updatedAt: number;
}

export type Recurrence = "once" | "daily" | "weekly" | "yearly";

export interface Photo {
  id?: number;
  blob: Blob;
  addedAt: number;
}

// ── Settings ──────────────────────────────────────────────────────────────────
// A single row (id = 1). The "souffle" of the whole display lives here.
export interface Settings {
  id?: number;
  fadeMs: number; // cross-fade duration
  dwellMs: number; // how long each pebble rests before dissolving
  shuffle: boolean; // weighted shuffle vs. strict order
  dayStart: number; // minutes-from-midnight when the display brightens
  nightStart: number; // minutes-from-midnight when it cools + dims
  nightDim: number; // 0–1: how far brightness drops at night
  kenBurns: boolean; // gentle drift on photos
  showClock: boolean; // a faint resting clock under each pebble
  tone: string; // a few words on the household's mood, fed to the Souffleur
  lang: "fr" | "en";
}

export const DEFAULT_SETTINGS: Settings = {
  id: 1,
  fadeMs: 2600,
  dwellMs: 11000,
  shuffle: true,
  dayStart: 7 * 60, // 07:00
  nightStart: 21 * 60, // 21:00
  nightDim: 0.6,
  kenBurns: true,
  showClock: true,
  tone: "",
  lang: "fr",
};

class GaletDB extends Dexie {
  entries!: Table<Entry, number>;
  photos!: Table<Photo, number>;
  settings!: Table<Settings, number>;

  constructor() {
    super("le-galet");
    this.version(1).stores({
      entries: "++id, type, order, weight, active, updatedAt",
      photos: "++id, addedAt",
      settings: "id",
    });
  }
}

export const db = new GaletDB();

export async function getSettings(): Promise<Settings> {
  const row = await db.settings.get(1);
  if (row) return { ...DEFAULT_SETTINGS, ...row, id: 1 };
  await db.settings.put(DEFAULT_SETTINGS);
  return DEFAULT_SETTINGS;
}

export async function saveSettings(patch: Partial<Settings>): Promise<void> {
  const current = await getSettings();
  await db.settings.put({ ...current, ...patch, id: 1 });
}

// Next manual order value, appended to the tail of the rotation.
async function nextOrder(): Promise<number> {
  const last = await db.entries.orderBy("order").last();
  return (last?.order ?? -1) + 1;
}

export async function addQuote(text: string, author: string): Promise<number> {
  const now = Date.now();
  return db.entries.add({
    type: "quote",
    text: text.trim(),
    author: author.trim(),
    weight: 1,
    order: await nextOrder(),
    active: true,
    source: "hand",
    createdAt: now,
    updatedAt: now,
  });
}

// A quote the Souffleur offered and the household chose to keep.
export async function addSouffleurQuote(text: string, author: string): Promise<number> {
  const now = Date.now();
  return db.entries.add({
    type: "quote",
    text: text.trim(),
    author: author.trim(),
    weight: 1,
    order: await nextOrder(),
    active: true,
    source: "souffleur",
    createdAt: now,
    updatedAt: now,
  });
}

// A quote imported from the magazine-margin feed (wiki/quotes → quotes-feed.json).
// Distinct provenance so it reads differently from hand-typed lines and can be
// filtered or weighted on its own later.
export async function addMarginQuote(text: string, author: string): Promise<number> {
  const now = Date.now();
  return db.entries.add({
    type: "quote",
    text: text.trim(),
    author: author.trim(),
    weight: 1,
    order: await nextOrder(),
    active: true,
    source: "margin",
    createdAt: now,
    updatedAt: now,
  });
}

export async function addReminder(
  text: string,
  startAt: number | null,
  endAt: number | null,
  recurrence: Recurrence,
): Promise<number> {
  const now = Date.now();
  return db.entries.add({
    type: "reminder",
    text: text.trim(),
    author: "",
    weight: 1,
    order: await nextOrder(),
    startAt,
    endAt,
    recurrence,
    active: true,
    source: "hand",
    createdAt: now,
    updatedAt: now,
  });
}

export async function addPhoto(file: Blob, caption: string): Promise<number> {
  const now = Date.now();
  const photoId = await db.photos.add({ blob: file, addedAt: now });
  return db.entries.add({
    type: "photo",
    text: caption.trim(),
    author: "",
    photoId,
    weight: 1,
    order: await nextOrder(),
    active: true,
    source: "hand",
    createdAt: now,
    updatedAt: now,
  });
}

export async function updateEntry(id: number, patch: Partial<Entry>): Promise<void> {
  await db.entries.update(id, { ...patch, updatedAt: Date.now() });
}

export async function deleteEntry(id: number): Promise<void> {
  const entry = await db.entries.get(id);
  if (entry?.photoId != null) await db.photos.delete(entry.photoId);
  await db.entries.delete(id);
}

export async function reorderEntries(orderedIds: number[]): Promise<void> {
  await db.transaction("rw", db.entries, async () => {
    await Promise.all(
      orderedIds.map((id, i) => db.entries.update(id, { order: i, updatedAt: Date.now() })),
    );
  });
}
