import { useEffect, useMemo, useRef, useState } from "react";
import type { Entry, Settings } from "../db";
import { buildPlaylist } from "../playlist";
import { clockLabel, nightFactor } from "../time";
import { useT } from "../i18n";
import { Drift, Expand, Pencil, Settings as SettingsIcon, Sparkle } from "./Icons";

interface Props {
  entries: Entry[];
  settings: Settings;
  photoUrls: Map<number, string>;
  onCompose: () => void;
  onSettings: () => void;
  onSouffleur: () => void;
}

const prefersReduced =
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// Blend amber (day) → slate (night) for the live accent.
const AMBER = [205, 154, 92];
const SLATE = [111, 129, 144];
function accentFor(f: number): string {
  const c = AMBER.map((a, i) => Math.round(a + (SLATE[i] - a) * f));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

export default function Galet({
  entries,
  settings,
  photoUrls,
  onCompose,
  onSettings,
  onSouffleur,
}: Props) {
  const t = useT();

  // A coarse clock — re-renders every 20s for dimming + the resting clock, and
  // rolls the minute bucket the playlist depends on.
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 20_000);
    return () => clearInterval(id);
  }, []);
  const now = new Date(nowMs);
  const minuteBucket = Math.floor(nowMs / 60_000);

  const playlist = useMemo(
    () => buildPlaylist(entries, settings, now),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [entries, settings, minuteBucket],
  );

  // ── The pebble engine: idx advances; a previous layer cross-dissolves out. ──
  const [idx, setIdx] = useState(0);
  const [prevIdx, setPrevIdx] = useState<number | null>(null);
  const fadeMs = prefersReduced ? 600 : settings.fadeMs;
  const dwellMs = Math.max(2500, settings.dwellMs);

  // Keep idx in range as the playlist changes shape.
  useEffect(() => {
    if (idx >= playlist.length) {
      setIdx(0);
      setPrevIdx(null);
    }
  }, [playlist.length, idx]);

  // Advance loop — only when there's more than one pebble to drift between.
  const advanceRef = useRef<number | null>(null);
  useEffect(() => {
    if (playlist.length <= 1) return;
    const id = window.setTimeout(() => {
      setPrevIdx(idx);
      setIdx((i) => (i + 1) % playlist.length);
    }, dwellMs);
    advanceRef.current = id;
    return () => window.clearTimeout(id);
  }, [idx, playlist.length, dwellMs]);

  // Clear the outgoing layer once its fade has finished.
  useEffect(() => {
    if (prevIdx === null) return;
    const id = window.setTimeout(() => setPrevIdx(null), fadeMs + 60);
    return () => window.clearTimeout(id);
  }, [prevIdx, fadeMs]);

  // ── Time-aware dimming + accent ─────────────────────────────────────────────
  const dimF = nightFactor(now, settings);
  const accent = accentFor(dimF);
  useEffect(() => {
    document.documentElement.style.setProperty("--accent", accent);
  }, [accent]);
  // Brightness: full by day, down to (1 - nightDim) at the heart of night.
  const brightness = 1 - dimF * settings.nightDim;

  // ── Keep the kitchen screen awake while drifting ────────────────────────────
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    let cancelled = false;
    const request = async () => {
      try {
        lock = (await navigator.wakeLock?.request("screen")) ?? null;
      } catch {
        /* not supported / denied — fine */
      }
    };
    const onVisible = () => {
      if (document.visibilityState === "visible" && !cancelled) request();
    };
    request();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      lock?.release().catch(() => {});
    };
  }, []);

  // ── Tap to reveal the (otherwise invisible) chrome, then it melts away ──────
  const [chrome, setChrome] = useState(false);
  const chromeTimer = useRef<number | null>(null);
  const reveal = () => {
    setChrome(true);
    if (chromeTimer.current) window.clearTimeout(chromeTimer.current);
    chromeTimer.current = window.setTimeout(() => setChrome(false), 4500);
  };

  const goFullscreen = () => {
    const el = document.documentElement;
    if (!document.fullscreenElement) el.requestFullscreen?.().catch(() => {});
    else document.exitFullscreen?.().catch(() => {});
    reveal();
  };

  // ── Empty state ─────────────────────────────────────────────────────────────
  if (playlist.length === 0) {
    return (
      <div className="vignette relative flex h-full w-full flex-col items-center justify-center px-8 text-center">
        <div className="animate-rise max-w-md">
          <div className="mb-7 text-mist-faint">
            <Drift className="mx-auto text-4xl" />
          </div>
          <h2 className="font-quote text-2xl font-light tracking-breathe text-mist">
            {t("emptyTitle")}
          </h2>
          <p className="mt-4 text-[15px] font-light leading-relaxed tracking-breathe text-mist-soft">
            {t("emptyBody")}
          </p>
          <button
            onClick={onCompose}
            className="mt-9 rounded-full border border-stone-700 px-7 py-2.5 text-sm tracking-wide2 text-mist transition-colors duration-300 hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]"
          >
            {t("startComposing")}
          </button>
        </div>
      </div>
    );
  }

  const current = playlist[idx];
  const previous = prevIdx !== null ? playlist[prevIdx] : null;

  return (
    <div
      className="vignette relative h-full w-full overflow-hidden bg-stone-900"
      onPointerDown={reveal}
    >
      {/* The dimming wash — eases the whole display darker at night. */}
      <div
        className="absolute inset-0 z-20 bg-stone-950 transition-opacity duration-[4000ms] ease-hush"
        style={{ opacity: 1 - brightness, pointerEvents: "none" }}
      />

      {previous && (
        <Pebble
          key={`prev-${prevIdx}`}
          entry={previous}
          photoUrls={photoUrls}
          settings={settings}
          fadeMs={fadeMs}
          dwellMs={dwellMs}
          variant={prevIdx ?? 0}
          out
        />
      )}
      <Pebble
        key={`cur-${idx}`}
        entry={current}
        photoUrls={photoUrls}
        settings={settings}
        fadeMs={fadeMs}
        dwellMs={dwellMs}
        variant={idx}
      />

      {/* Resting clock — faint, low, never insistent. */}
      {settings.showClock && (
        <div className="pointer-events-none absolute inset-x-0 bottom-7 z-30 flex justify-center">
          <span className="text-[13px] font-light tracking-wide3 text-mist-faint/70">
            {clockLabel(now, settings.lang)}
          </span>
        </div>
      )}

      {/* Chrome: invisible until a tap, then it fades away on its own. */}
      <div
        className={`absolute right-5 top-5 z-40 flex gap-2.5 transition-opacity duration-700 ${
          chrome ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <ChromeButton label={t("souffleur")} onClick={onSouffleur}>
          <Sparkle />
        </ChromeButton>
        <ChromeButton label={t("compose")} onClick={onCompose}>
          <Pencil />
        </ChromeButton>
        <ChromeButton label={t("settings")} onClick={onSettings}>
          <SettingsIcon />
        </ChromeButton>
        <ChromeButton label={t("fullscreen")} onClick={goFullscreen}>
          <Expand />
        </ChromeButton>
      </div>

      {/* A whisper of a hint, only while chrome is up. */}
      <div
        className={`pointer-events-none absolute inset-x-0 top-6 z-30 flex justify-center transition-opacity duration-700 ${
          chrome ? "opacity-100" : "opacity-0"
        }`}
      >
        <span className="text-[11px] uppercase tracking-wide3 text-mist-faint/60">
          {t("tapToCurate")}
        </span>
      </div>
    </div>
  );
}

function ChromeButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className="flex h-11 w-11 items-center justify-center rounded-full border border-stone-700/70 bg-stone-900/60 text-lg text-mist-soft backdrop-blur-sm transition-colors duration-300 hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]"
    >
      {children}
    </button>
  );
}

// ── A single drifting pebble ────────────────────────────────────────────────
function Pebble({
  entry,
  photoUrls,
  settings,
  fadeMs,
  dwellMs,
  variant,
  out = false,
}: {
  entry: Entry;
  photoUrls: Map<number, string>;
  settings: Settings;
  fadeMs: number;
  dwellMs: number;
  variant: number;
  out?: boolean;
}) {
  const animation = out
    ? `dissolveOut ${fadeMs}ms ease-hush forwards`
    : `dissolveIn ${fadeMs}ms ease-hush both`;

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center" style={{ animation }}>
      {entry.type === "photo" ? (
        <PhotoPebble
          entry={entry}
          url={entry.photoId != null ? photoUrls.get(entry.photoId) : undefined}
          settings={settings}
          dwellMs={dwellMs}
          fadeMs={fadeMs}
          variant={variant}
        />
      ) : entry.type === "quote" ? (
        <QuotePebble entry={entry} />
      ) : (
        <ReminderPebble entry={entry} />
      )}
    </div>
  );
}

function PhotoPebble({
  entry,
  url,
  settings,
  dwellMs,
  fadeMs,
  variant,
}: {
  entry: Entry;
  url?: string;
  settings: Settings;
  dwellMs: number;
  fadeMs: number;
  variant: number;
}) {
  if (!url) return null;
  const driftClass =
    settings.kenBurns && !prefersReduced ? `drift-${variant % 4}` : "";
  const driftDur = `${dwellMs + fadeMs * 2}ms`;

  return (
    <>
      {/* A soft, blurred fill so any aspect ratio sits on a calm bed, not bars. */}
      <div
        className="absolute inset-0 scale-110 bg-cover bg-center blur-2xl"
        style={{ backgroundImage: `url(${url})`, opacity: 0.4 }}
      />
      <div className="absolute inset-0 overflow-hidden">
        <img
          src={url}
          alt={entry.text || ""}
          className={`h-full w-full object-cover ${driftClass}`}
          style={{ ["--drift-dur" as string]: driftDur }}
        />
      </div>
      {/* Gradient floor so a caption stays legible. */}
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-stone-950/70 to-transparent" />
      {entry.text && (
        <p className="absolute bottom-16 left-0 right-0 px-10 text-center font-quote text-lg font-light italic tracking-breathe text-quote/90">
          {entry.text}
        </p>
      )}
    </>
  );
}

function QuotePebble({ entry }: { entry: Entry }) {
  return (
    <div className="max-w-3xl px-10 text-center">
      <p className="font-quote text-[clamp(1.8rem,4.6vw,3.4rem)] font-light leading-[1.32] tracking-breathe text-quote">
        {entry.text}
      </p>
      {entry.author && (
        <p className="mt-8 text-sm font-light uppercase tracking-wide3 text-[color:var(--accent)]/85">
          {entry.author}
        </p>
      )}
    </div>
  );
}

function ReminderPebble({ entry }: { entry: Entry }) {
  return (
    <div className="max-w-2xl px-10 text-center">
      <div className="mx-auto mb-7 h-px w-10 bg-[color:var(--accent)]/50" />
      <p className="text-[clamp(1.5rem,3.4vw,2.4rem)] font-light leading-snug tracking-breathe text-mist">
        {entry.text}
      </p>
    </div>
  );
}
