import type { Entry, Settings } from "./db";

// Minutes-from-midnight for a given moment.
export function minutesOfDay(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

// Is the display in its "night" window? Handles the usual wrap where night
// starts in the evening and runs past midnight into the morning.
export function isNight(now: Date, settings: Settings): boolean {
  const m = minutesOfDay(now);
  const { dayStart, nightStart } = settings;
  if (nightStart > dayStart) {
    // e.g. day 07:00 → night 21:00: night is outside [dayStart, nightStart)
    return m >= nightStart || m < dayStart;
  }
  // inverted/unusual config: night is the inner band
  return m >= nightStart && m < dayStart;
}

// 0 → full day brightness, 1 → fully dimmed. Eased near the boundaries so the
// transition over the threshold minutes is a soft fade rather than a hard cut.
export function nightFactor(now: Date, settings: Settings): number {
  const RAMP = 30; // minutes of soft fade on either side of the threshold
  const m = minutesOfDay(now);
  const { dayStart, nightStart } = settings;

  const distTo = (target: number): number => {
    let d = Math.abs(m - target);
    d = Math.min(d, 1440 - d); // shortest way around the clock
    return d;
  };

  const night = isNight(now, settings);
  const edge = Math.min(distTo(dayStart), distTo(nightStart));
  const t = Math.min(1, edge / RAMP); // 0 at the boundary → 1 once clear of it
  return night ? t : 0;
}

// Format hh:mm in the display language, 24h FR / 12h EN feel kept simple.
export function clockLabel(d: Date, lang: "fr" | "en"): string {
  const hh = d.getHours();
  const mm = d.getMinutes().toString().padStart(2, "0");
  if (lang === "en") {
    const h12 = ((hh + 11) % 12) + 1;
    const ap = hh < 12 ? "am" : "pm";
    return `${h12}:${mm} ${ap}`;
  }
  return `${hh.toString().padStart(2, "0")} h ${mm}`;
}

export type Season = "printemps" | "été" | "automne" | "hiver";

export function seasonOf(d: Date): Season {
  const m = d.getMonth(); // 0–11, northern hemisphere
  if (m <= 1 || m === 11) return "hiver";
  if (m <= 4) return "printemps";
  if (m <= 7) return "été";
  return "automne";
}

export const SEASON_EN: Record<Season, string> = {
  printemps: "spring",
  été: "summer",
  automne: "autumn",
  hiver: "winter",
};

// Does a reminder entry belong in the rotation right now?
export function reminderActive(entry: Entry, now: Date): boolean {
  if (entry.type !== "reminder") return true;
  const t = now.getTime();
  const { startAt, endAt, recurrence } = entry;
  if (startAt == null && endAt == null) return true; // an always-on nudge

  if (!recurrence || recurrence === "once") {
    if (startAt != null && t < startAt) return false;
    if (endAt != null && t > endAt) return false;
    return true;
  }

  // Recurring: compare the time-of-year / time-of-week / time-of-day window,
  // anchored on startAt..endAt, ignoring the absolute year/week.
  const s = startAt != null ? new Date(startAt) : null;
  const e = endAt != null ? new Date(endAt) : null;

  if (recurrence === "daily") {
    const ms = s ? minutesOfDay(s) : 0;
    const me = e ? minutesOfDay(e) : 1440;
    const m = minutesOfDay(now);
    return m >= ms && m <= me;
  }
  if (recurrence === "weekly") {
    const day = now.getDay();
    const sd = s ? s.getDay() : day;
    const ed = e ? e.getDay() : sd;
    return day >= Math.min(sd, ed) && day <= Math.max(sd, ed);
  }
  // yearly — a band of the calendar (e.g. a birthday week)
  const doy = dayOfYear(now);
  const sdoy = s ? dayOfYear(s) : doy;
  const edoy = e ? dayOfYear(e) : sdoy;
  return doy >= Math.min(sdoy, edoy) && doy <= Math.max(sdoy, edoy);
}

function dayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d.getTime() - start.getTime()) / 86_400_000);
}
