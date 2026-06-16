import { useState } from "react";
import type { Entry, Recurrence } from "../db";
import { useT } from "../i18n";

export type DraftKind = "quote" | "reminder" | "photo";

export interface EditorDraft {
  kind: DraftKind;
  entry?: Entry; // present when editing
}

interface Props {
  draft: EditorDraft;
  onSave: (data: {
    text: string;
    author: string;
    startAt: number | null;
    endAt: number | null;
    recurrence: Recurrence;
  }) => void;
  onClose: () => void;
}

function toLocalInput(ms?: number | null): string {
  if (ms == null) return "";
  const d = new Date(ms - new Date(ms).getTimezoneOffset() * 60000);
  return d.toISOString().slice(0, 16);
}
function fromLocalInput(v: string): number | null {
  if (!v) return null;
  const ms = new Date(v).getTime();
  return Number.isNaN(ms) ? null : ms;
}

export default function EntryEditor({ draft, onSave, onClose }: Props) {
  const t = useT();
  const e = draft.entry;
  const [text, setText] = useState(e?.text ?? "");
  const [author, setAuthor] = useState(e?.author ?? "");
  const [timed, setTimed] = useState(e?.startAt != null || e?.endAt != null);
  const [start, setStart] = useState(toLocalInput(e?.startAt));
  const [end, setEnd] = useState(toLocalInput(e?.endAt));
  const [recurrence, setRecurrence] = useState<Recurrence>(e?.recurrence ?? "once");

  const isReminder = draft.kind === "reminder";
  const isPhoto = draft.kind === "photo";

  const title = isReminder
    ? t("reminderTitle")
    : isPhoto
      ? t("captionTitle")
      : t("quoteTitle");

  const canSave = isPhoto ? true : text.trim().length > 0;

  const save = () => {
    if (!canSave) return;
    onSave({
      text,
      author,
      startAt: isReminder && timed ? fromLocalInput(start) : null,
      endAt: isReminder && timed ? fromLocalInput(end) : null,
      recurrence: isReminder ? recurrence : "once",
    });
  };

  const recOptions: { v: Recurrence; k: "rec_once" | "rec_daily" | "rec_weekly" | "rec_yearly" }[] = [
    { v: "once", k: "rec_once" },
    { v: "daily", k: "rec_daily" },
    { v: "weekly", k: "rec_weekly" },
    { v: "yearly", k: "rec_yearly" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-stone-950/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        className="animate-rise w-full max-w-lg rounded-t-3xl border border-stone-700/70 bg-stone-850 p-7 shadow-2xl sm:rounded-3xl"
        onClick={(ev) => ev.stopPropagation()}
      >
        <h3 className="mb-5 font-quote text-xl font-light tracking-breathe text-mist">{title}</h3>

        {isReminder ? (
          <input
            autoFocus
            value={text}
            onChange={(ev) => setText(ev.target.value)}
            placeholder={t("reminderPlaceholder")}
            className="w-full rounded-xl border border-stone-700 bg-stone-900 px-4 py-3 text-[15px] tracking-breathe text-mist placeholder:text-mist-faint/60 focus:border-[color:var(--accent)] focus:outline-none"
          />
        ) : (
          <textarea
            autoFocus
            value={text}
            onChange={(ev) => setText(ev.target.value)}
            placeholder={isPhoto ? t("captionPlaceholder") : t("quotePlaceholder")}
            rows={isPhoto ? 2 : 4}
            className="w-full resize-none rounded-xl border border-stone-700 bg-stone-900 px-4 py-3 font-quote text-lg font-light leading-relaxed tracking-breathe text-quote placeholder:font-sans placeholder:text-base placeholder:text-mist-faint/60 focus:border-[color:var(--accent)] focus:outline-none"
          />
        )}

        {draft.kind === "quote" && (
          <input
            value={author}
            onChange={(ev) => setAuthor(ev.target.value)}
            placeholder={t("authorPlaceholder")}
            className="mt-3 w-full rounded-xl border border-stone-700 bg-stone-900 px-4 py-2.5 text-sm uppercase tracking-wide2 text-mist-soft placeholder:normal-case placeholder:tracking-normal placeholder:text-mist-faint/60 focus:border-[color:var(--accent)] focus:outline-none"
          />
        )}

        {isReminder && (
          <div className="mt-5">
            <label className="flex cursor-pointer items-center gap-3 text-sm tracking-breathe text-mist-soft">
              <button
                type="button"
                role="switch"
                aria-checked={timed}
                onClick={() => setTimed((v) => !v)}
                className={`relative h-6 w-11 rounded-full transition-colors duration-300 ${
                  timed ? "bg-[color:var(--accent)]" : "bg-stone-700"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-stone-950 transition-all duration-300 ${
                    timed ? "left-[22px]" : "left-0.5"
                  }`}
                />
              </button>
              {timed ? t("whenWindow") : t("always")}
            </label>

            {timed && (
              <div className="mt-4 space-y-3 rounded-2xl border border-stone-700/60 bg-stone-900/60 p-4">
                <div className="flex flex-wrap items-center gap-2 text-sm text-mist-soft">
                  <span className="w-8 shrink-0 text-mist-faint">{t("from")}</span>
                  <input
                    type="datetime-local"
                    value={start}
                    onChange={(ev) => setStart(ev.target.value)}
                    className="flex-1 rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-sm text-mist [color-scheme:dark] focus:border-[color:var(--accent)] focus:outline-none"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm text-mist-soft">
                  <span className="w-8 shrink-0 text-mist-faint">{t("to")}</span>
                  <input
                    type="datetime-local"
                    value={end}
                    onChange={(ev) => setEnd(ev.target.value)}
                    className="flex-1 rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-sm text-mist [color-scheme:dark] focus:border-[color:var(--accent)] focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs uppercase tracking-wide2 text-mist-faint">
                    {t("recurrence")}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {recOptions.map((o) => (
                      <button
                        key={o.v}
                        onClick={() => setRecurrence(o.v)}
                        className={`rounded-full px-3 py-1 text-xs tracking-breathe transition-colors duration-200 ${
                          recurrence === o.v
                            ? "bg-[color:var(--accent)] text-stone-950"
                            : "border border-stone-700 text-mist-soft hover:text-mist"
                        }`}
                      >
                        {t(o.k)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-7 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-full px-5 py-2 text-sm tracking-wide2 text-mist-soft transition-colors hover:text-mist"
          >
            {t("cancel")}
          </button>
          <button
            onClick={save}
            disabled={!canSave}
            className="rounded-full bg-[color:var(--accent)] px-6 py-2 text-sm font-medium tracking-wide2 text-stone-950 transition-opacity disabled:opacity-40"
          >
            {t("save")}
          </button>
        </div>
      </div>
    </div>
  );
}
