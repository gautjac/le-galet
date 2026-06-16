import type { Settings } from "../db";
import { saveSettings } from "../db";
import { useT } from "../i18n";
import { Back } from "./Icons";

interface Props {
  settings: Settings;
  onBack: () => void;
}

function minToInput(min: number): string {
  const h = Math.floor(min / 60).toString().padStart(2, "0");
  const m = (min % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}
function inputToMin(v: string): number {
  const [h, m] = v.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export default function Reglages({ settings, onBack }: Props) {
  const t = useT();
  const set = (patch: Partial<Settings>) => saveSettings(patch);

  return (
    <div className="no-scrollbar mx-auto h-full max-w-2xl overflow-y-auto">
      <header className="flex items-center gap-4 px-6 pb-2 pt-7">
        <button
          onClick={onBack}
          aria-label={t("back")}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-700 text-mist-soft transition-colors hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]"
        >
          <Back />
        </button>
        <h1 className="font-quote text-2xl font-light tracking-breathe text-mist">
          {t("reglagesTitle")}
        </h1>
      </header>

      <div className="space-y-8 px-6 pb-16 pt-4">
        {/* Pace */}
        <Section title={t("pace")}>
          <Slider
            label={t("fade")}
            value={settings.fadeMs}
            min={800}
            max={6000}
            step={200}
            display={`${(settings.fadeMs / 1000).toFixed(1)} ${t("seconds")}`}
            onChange={(v) => set({ fadeMs: v })}
          />
          <Slider
            label={t("dwell")}
            value={settings.dwellMs}
            min={4000}
            max={40000}
            step={1000}
            display={`${Math.round(settings.dwellMs / 1000)} ${t("seconds")}`}
            onChange={(v) => set({ dwellMs: v })}
          />
        </Section>

        {/* Order */}
        <Section title={t("order")}>
          <Toggle
            on={settings.shuffle}
            onLabel={t("shuffleOn")}
            offLabel={t("shuffleOff")}
            onChange={(v) => set({ shuffle: v })}
          />
        </Section>

        {/* Day & night */}
        <Section title={t("rhythmNight")}>
          <TimeRow
            label={t("dayStart")}
            value={minToInput(settings.dayStart)}
            onChange={(v) => set({ dayStart: inputToMin(v) })}
          />
          <TimeRow
            label={t("nightStart")}
            value={minToInput(settings.nightStart)}
            onChange={(v) => set({ nightStart: inputToMin(v) })}
          />
          <Slider
            label={t("nightDim")}
            value={Math.round(settings.nightDim * 100)}
            min={0}
            max={90}
            step={5}
            display={`${Math.round(settings.nightDim * 100)} %`}
            onChange={(v) => set({ nightDim: v / 100 })}
          />
        </Section>

        {/* Texture */}
        <Section title={t("texture")}>
          <Toggle
            on={settings.kenBurns}
            onLabel={t("kenBurns")}
            offLabel={t("kenBurns")}
            onChange={(v) => set({ kenBurns: v })}
          />
          <Toggle
            on={settings.showClock}
            onLabel={t("showClock")}
            offLabel={t("showClock")}
            onChange={(v) => set({ showClock: v })}
          />
        </Section>

        {/* Household / tone */}
        <Section title={t("household")}>
          <label className="block text-sm tracking-breathe text-mist-soft">{t("toneLabel")}</label>
          <textarea
            value={settings.tone}
            onChange={(e) => set({ tone: e.target.value })}
            placeholder={t("tonePlaceholder")}
            rows={3}
            className="mt-2 w-full resize-none rounded-xl border border-stone-700 bg-stone-900 px-4 py-3 text-[15px] tracking-breathe text-mist placeholder:text-mist-faint/60 focus:border-[color:var(--accent)] focus:outline-none"
          />
          <p className="mt-2 text-[12px] leading-relaxed tracking-breathe text-mist-faint">
            {t("toneHelp")}
          </p>
        </Section>

        {/* Language */}
        <Section title={t("language")}>
          <div className="flex gap-2">
            {(["fr", "en"] as const).map((l) => (
              <button
                key={l}
                onClick={() => set({ lang: l })}
                className={`flex-1 rounded-xl border py-3 text-sm uppercase tracking-wide2 transition-colors ${
                  settings.lang === l
                    ? "border-[color:var(--accent)] bg-[color:var(--accent)]/10 text-[color:var(--accent)]"
                    : "border-stone-700 text-mist-soft hover:text-mist"
                }`}
              >
                {l === "fr" ? "Français" : "English"}
              </button>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-[11px] uppercase tracking-wide3 text-mist-faint">{title}</h2>
      <div className="space-y-4 rounded-2xl border border-stone-700/50 bg-stone-850 p-5">{children}</div>
    </section>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-sm tracking-breathe text-mist">{label}</span>
        <span className="text-sm tabular-nums tracking-wide2 text-[color:var(--accent)]">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
    </div>
  );
}

function Toggle({
  on,
  onLabel,
  offLabel,
  onChange,
}: {
  on: boolean;
  onLabel: string;
  offLabel: string;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!on)}
      className="flex w-full items-center justify-between text-left"
    >
      <span className="text-sm tracking-breathe text-mist">{on ? onLabel : offLabel}</span>
      <span
        role="switch"
        aria-checked={on}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300 ${
          on ? "bg-[color:var(--accent)]" : "bg-stone-700"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-stone-950 transition-all duration-300 ${
            on ? "left-[22px]" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}

function TimeRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm tracking-breathe text-mist">{label}</span>
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-sm tabular-nums text-mist [color-scheme:dark] focus:border-[color:var(--accent)] focus:outline-none"
      />
    </div>
  );
}
