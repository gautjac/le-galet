import { useRef, useState } from "react";
import {
  addPhoto,
  addQuote,
  addReminder,
  deleteEntry,
  reorderEntries,
  updateEntry,
  type Entry,
} from "../db";
import { processImage } from "../image";
import { plural, useLang, useT } from "../i18n";
import EntryEditor, { type EditorDraft } from "./EntryEditor";
import { Back, Bell, Eye, EyeOff, Grip, Pencil, Photo, Plus, Quote, Trash } from "./Icons";

interface Props {
  entries: Entry[];
  photoUrls: Map<number, string>;
  onBack: () => void;
}

export default function Composer({ entries, photoUrls, onBack }: Props) {
  const t = useT();
  const lang = useLang();
  const fileRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<EditorDraft | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragId, setDragId] = useState<number | null>(null);

  const sorted = [...entries].sort((a, b) => a.order - b.order);
  const activeCount = entries.filter((e) => e.active).length;

  const onPickFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      for (const file of Array.from(files)) {
        const blob = await processImage(file);
        await addPhoto(blob, "");
      }
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const saveDraft = async (data: {
    text: string;
    author: string;
    startAt: number | null;
    endAt: number | null;
    recurrence: import("../db").Recurrence;
  }) => {
    if (!draft) return;
    if (draft.entry?.id != null) {
      await updateEntry(draft.entry.id, {
        text: data.text.trim(),
        author: data.author.trim(),
        startAt: data.startAt,
        endAt: data.endAt,
        recurrence: data.recurrence,
      });
    } else if (draft.kind === "quote") {
      await addQuote(data.text, data.author);
    } else if (draft.kind === "reminder") {
      await addReminder(data.text, data.startAt, data.endAt, data.recurrence);
    }
    setDraft(null);
  };

  // Drag-to-reorder over the live ordered list.
  const onDrop = async (targetId: number) => {
    if (dragId === null || dragId === targetId) return setDragId(null);
    const ids = sorted.map((e) => e.id!);
    const from = ids.indexOf(dragId);
    const to = ids.indexOf(targetId);
    if (from === -1 || to === -1) return setDragId(null);
    ids.splice(to, 0, ids.splice(from, 1)[0]);
    await reorderEntries(ids);
    setDragId(null);
  };

  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col">
      <header className="flex items-center gap-4 px-6 pb-4 pt-7">
        <button
          onClick={onBack}
          aria-label={t("back")}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-700 text-mist-soft transition-colors hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]"
        >
          <Back />
        </button>
        <div className="min-w-0">
          <h1 className="font-quote text-2xl font-light tracking-breathe text-mist">
            {t("composerTitle")}
          </h1>
          <p className="truncate text-[13px] tracking-breathe text-mist-faint">
            {entries.length ? plural(lang, activeCount) : t("composerSub")}
          </p>
        </div>
      </header>

      {/* Add row */}
      <div className="flex gap-2.5 px-6 pb-4">
        <AddButton icon={<Photo />} label={t("addPhoto")} onClick={() => fileRef.current?.click()} busy={busy} />
        <AddButton icon={<Quote />} label={t("addQuote")} onClick={() => setDraft({ kind: "quote" })} />
        <AddButton icon={<Bell />} label={t("addReminder")} onClick={() => setDraft({ kind: "reminder" })} />
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => onPickFiles(e.target.files)}
        />
      </div>

      {/* List */}
      <div className="no-scrollbar flex-1 overflow-y-auto px-6 pb-10">
        {sorted.length === 0 ? (
          <div className="mt-16 text-center text-mist-faint">
            <Plus className="mx-auto mb-3 text-3xl opacity-40" />
            <p className="text-sm tracking-breathe">{t("nothingYet")}</p>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {sorted.map((entry) => (
              <li
                key={entry.id}
                draggable
                onDragStart={() => setDragId(entry.id!)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDrop(entry.id!)}
                onDragEnd={() => setDragId(null)}
                className={`group flex items-center gap-3 rounded-2xl border bg-stone-850 p-3 transition-all duration-200 ${
                  dragId === entry.id
                    ? "border-[color:var(--accent)] opacity-60"
                    : "border-stone-700/60"
                } ${entry.active ? "" : "opacity-50"}`}
              >
                <span className="cursor-grab text-mist-faint active:cursor-grabbing">
                  <Grip />
                </span>

                <Thumb entry={entry} url={entry.photoId != null ? photoUrls.get(entry.photoId) : undefined} />

                <div className="min-w-0 flex-1">
                  <p className={`truncate text-[15px] tracking-breathe ${entry.type === "quote" ? "font-quote font-light text-quote" : "text-mist"}`}>
                    {entry.text || (entry.type === "photo" ? "—" : "")}
                  </p>
                  <p className="mt-0.5 flex items-center gap-2 text-[11px] uppercase tracking-wide2 text-mist-faint">
                    <TypeTag entry={entry} />
                    {entry.source === "souffleur" && (
                      <span className="text-[color:var(--accent)]/70">· {t("bySouffleur")}</span>
                    )}
                  </p>
                </div>

                {/* Weight (frequency) */}
                <WeightDots
                  weight={entry.weight}
                  onSet={(w) => updateEntry(entry.id!, { weight: w })}
                />

                {/* Row actions */}
                <div className="flex items-center gap-1">
                  <IconBtn
                    label={entry.active ? t("hide") : t("show")}
                    onClick={() => updateEntry(entry.id!, { active: !entry.active })}
                  >
                    {entry.active ? <Eye /> : <EyeOff />}
                  </IconBtn>
                  {entry.type !== "photo" && (
                    <IconBtn label={t("edit")} onClick={() => setDraft({ kind: entry.type, entry })}>
                      <Pencil />
                    </IconBtn>
                  )}
                  {entry.type === "photo" && (
                    <IconBtn label={t("edit")} onClick={() => setDraft({ kind: "photo", entry })}>
                      <Pencil />
                    </IconBtn>
                  )}
                  <IconBtn label={t("remove")} danger onClick={() => deleteEntry(entry.id!)}>
                    <Trash />
                  </IconBtn>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {draft && (
        <EntryEditor
          draft={draft}
          onSave={(data) =>
            draft.kind === "photo" && draft.entry?.id != null
              ? updateEntry(draft.entry.id, { text: data.text.trim() }).then(() => setDraft(null))
              : saveDraft(data)
          }
          onClose={() => setDraft(null)}
        />
      )}
    </div>
  );
}

function AddButton({
  icon,
  label,
  onClick,
  busy,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  busy?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className="flex flex-1 flex-col items-center gap-1.5 rounded-2xl border border-stone-700/70 bg-stone-850 py-4 text-mist-soft transition-all duration-200 hover:border-[color:var(--accent)] hover:text-[color:var(--accent)] disabled:opacity-50"
    >
      <span className={`text-xl ${busy ? "animate-breathe" : ""}`}>{icon}</span>
      <span className="text-xs tracking-wide2">{label}</span>
    </button>
  );
}

function Thumb({ entry, url }: { entry: Entry; url?: string }) {
  if (entry.type === "photo" && url) {
    return (
      <div
        className="h-11 w-11 shrink-0 rounded-lg bg-cover bg-center"
        style={{ backgroundImage: `url(${url})` }}
      />
    );
  }
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-stone-800 text-mist-faint">
      {entry.type === "quote" ? <Quote /> : entry.type === "reminder" ? <Bell /> : <Photo />}
    </div>
  );
}

function TypeTag({ entry }: { entry: Entry }) {
  const t = useT();
  if (entry.type === "quote") return <span>{entry.author || t("addQuote")}</span>;
  if (entry.type === "reminder") {
    const timed = entry.startAt != null || entry.endAt != null;
    return <span>{timed ? t("addReminder") : t("always")}</span>;
  }
  return <span>{t("addPhoto")}</span>;
}

function WeightDots({ weight, onSet }: { weight: number; onSet: (w: number) => void }) {
  const t = useT();
  return (
    <div className="hidden items-center gap-1 sm:flex" title={t("weight")}>
      {[1, 2, 3].map((w) => (
        <button
          key={w}
          aria-label={`${t("weight")} ${w}`}
          onClick={() => onSet(w)}
          className={`h-2 w-2 rounded-full transition-colors ${
            (weight || 1) >= w ? "bg-[color:var(--accent)]" : "bg-stone-700"
          }`}
        />
      ))}
    </div>
  );
}

function IconBtn({
  children,
  label,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className={`flex h-9 w-9 items-center justify-center rounded-full text-base text-mist-faint transition-colors hover:bg-stone-800 ${
        danger ? "hover:text-rose-300" : "hover:text-mist"
      }`}
    >
      {children}
    </button>
  );
}
