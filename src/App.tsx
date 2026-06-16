import { useEffect, useMemo, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, DEFAULT_SETTINGS, getSettings, type Settings } from "./db";
import { LangProvider } from "./i18n";
import Galet from "./components/Galet";
import Composer from "./components/Composer";
import Reglages from "./components/Reglages";
import Souffleur from "./components/Souffleur";
import Onboarding from "./components/Onboarding";

type View = "galet" | "composer" | "settings" | "souffleur";

const ONBOARD_KEY = "le-galet-onboarded";
const IDLE_RETURN_MS = 120_000; // a curation view left untouched drifts back to the display

export default function App() {
  // liveQuery must stay read-only — we only READ settings here and seed the row
  // in an effect below (a write inside liveQuery throws ReadOnlyError).
  const settingsRow = useLiveQuery(() => db.settings.get(1), []);
  const settings: Settings = { ...DEFAULT_SETTINGS, ...(settingsRow ?? {}), id: 1 };
  const entries = useLiveQuery(() => db.entries.toArray(), [], []) ?? [];
  const photos = useLiveQuery(() => db.photos.toArray(), [], []) ?? [];

  // Ensure the settings row exists once, outside the read-only liveQuery.
  useEffect(() => {
    if (settingsRow === undefined) getSettings();
  }, [settingsRow]);

  const [view, setView] = useState<View>("galet");
  const [onboarded, setOnboarded] = useState(() => {
    try {
      return localStorage.getItem(ONBOARD_KEY) === "1";
    } catch {
      return false;
    }
  });

  // Object URLs for photo blobs, rebuilt whenever the photo set changes.
  const [photoUrls, setPhotoUrls] = useState<Map<number, string>>(new Map());
  useEffect(() => {
    const map = new Map<number, string>();
    photos.forEach((p) => {
      if (p.id != null) map.set(p.id, URL.createObjectURL(p.blob));
    });
    setPhotoUrls(map);
    return () => map.forEach((u) => URL.revokeObjectURL(u));
  }, [photos]);

  // Idle return: if a curation view sits untouched, drift back to the display.
  const idleTimer = useRef<number | null>(null);
  useEffect(() => {
    if (view === "galet") return;
    const arm = () => {
      if (idleTimer.current) window.clearTimeout(idleTimer.current);
      idleTimer.current = window.setTimeout(() => setView("galet"), IDLE_RETURN_MS);
    };
    arm();
    const events = ["pointerdown", "keydown", "pointermove"] as const;
    events.forEach((e) => window.addEventListener(e, arm, { passive: true }));
    return () => {
      if (idleTimer.current) window.clearTimeout(idleTimer.current);
      events.forEach((e) => window.removeEventListener(e, arm));
    };
  }, [view]);

  const finishOnboarding = () => {
    try {
      localStorage.setItem(ONBOARD_KEY, "1");
    } catch {
      /* private mode / sandboxed storage — the overlay still closes for the session */
    }
    setOnboarded(true);
  };

  const lang = settings.lang;

  const body = useMemo(() => {
    switch (view) {
      case "composer":
        return <Composer entries={entries} photoUrls={photoUrls} onBack={() => setView("galet")} />;
      case "settings":
        return <Reglages settings={settings} onBack={() => setView("galet")} />;
      case "souffleur":
        return <Souffleur entries={entries} tone={settings.tone} onBack={() => setView("galet")} />;
      default:
        return (
          <Galet
            entries={entries}
            settings={settings}
            photoUrls={photoUrls}
            onCompose={() => setView("composer")}
            onSettings={() => setView("settings")}
            onSouffleur={() => setView("souffleur")}
          />
        );
    }
  }, [view, entries, settings, photoUrls]);

  return (
    <LangProvider lang={lang}>
      <div className="h-full w-full bg-stone-900 text-mist">
        {body}
        {!onboarded && <Onboarding onDone={finishOnboarding} />}
      </div>
    </LangProvider>
  );
}
