import { useState } from "react";
import { fetchSouffle, type GreetingCard, type QuoteSuggestion } from "../api";
import { addSouffleurQuote, type Entry } from "../db";
import { useLang, useT } from "../i18n";
import { SEASON_EN, seasonOf } from "../time";
import { Back, Plus, Sparkle } from "./Icons";

interface Props {
  entries: Entry[];
  tone: string;
  onBack: () => void;
}

export default function Souffleur({ entries, tone, onBack }: Props) {
  const t = useT();
  const lang = useLang();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [greetings, setGreetings] = useState<GreetingCard[]>([]);
  const [quotes, setQuotes] = useState<QuoteSuggestion[]>([]);
  const [added, setAdded] = useState<Set<string>>(new Set());

  const conjure = async () => {
    setLoading(true);
    setError(null);
    try {
      const now = new Date();
      const season = lang === "fr" ? seasonOf(now) : SEASON_EN[seasonOf(now)];
      const dateLabel = now.toLocaleDateString(lang === "fr" ? "fr-CA" : "en-CA", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
      const existing = entries
        .filter((e) => e.type === "quote")
        .map((e) => e.text)
        .slice(0, 16);

      const res = await fetchSouffle({ lang, season, dateLabel, tone, existing });
      setGreetings(res.greetings);
      setQuotes(res.quotes);
      setAdded(new Set());
    } catch (e) {
      setError(e instanceof Error ? e.message : t("souffleurError"));
    } finally {
      setLoading(false);
    }
  };

  const keep = async (key: string, text: string, author: string) => {
    await addSouffleurQuote(text, author);
    setAdded((s) => new Set(s).add(key));
  };

  const hasResults = greetings.length > 0 || quotes.length > 0;

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
        <h1 className="flex items-center gap-2 font-quote text-2xl font-light tracking-breathe text-mist">
          <Sparkle className="text-[color:var(--accent)]" />
          {t("souffleurTitle")}
        </h1>
      </header>

      <div className="px-6 pb-16 pt-3">
        <p className="max-w-xl text-[14px] font-light leading-relaxed tracking-breathe text-mist-soft">
          {t("souffleurSub")}
        </p>

        <button
          onClick={conjure}
          disabled={loading}
          className="mt-6 flex items-center gap-2.5 rounded-full bg-[color:var(--accent)] px-6 py-3 text-sm font-medium tracking-wide2 text-stone-950 transition-opacity disabled:opacity-60"
        >
          <Sparkle className={loading ? "animate-breathe" : ""} />
          {loading ? t("conjuring") : hasResults ? t("again") : t("conjure")}
        </button>

        {error && (
          <p className="mt-5 rounded-xl border border-rose-400/30 bg-rose-400/5 px-4 py-3 text-sm tracking-breathe text-rose-200/90">
            {error}
          </p>
        )}

        {loading && !hasResults && (
          <div className="mt-10 space-y-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-20 animate-breathe rounded-2xl border border-stone-700/40 bg-stone-850"
                style={{ animationDelay: `${i * 200}ms` }}
              />
            ))}
          </div>
        )}

        {greetings.length > 0 && (
          <section className="mt-9">
            <h2 className="mb-3 text-[11px] uppercase tracking-wide3 text-mist-faint">
              {t("greetings")}
            </h2>
            <div className="space-y-3">
              {greetings.map((g, i) => {
                const key = `g-${i}-${g.text}`;
                return (
                  <Card
                    key={key}
                    body={<span className="font-quote text-lg font-light italic text-quote">{g.text}</span>}
                    meta={g.note}
                    added={added.has(key)}
                    onAdd={() => keep(key, g.text, "")}
                  />
                );
              })}
            </div>
          </section>
        )}

        {quotes.length > 0 && (
          <section className="mt-9">
            <h2 className="mb-3 text-[11px] uppercase tracking-wide3 text-mist-faint">{t("quotes")}</h2>
            <div className="space-y-3">
              {quotes.map((q, i) => {
                const key = `q-${i}-${q.text}`;
                return (
                  <Card
                    key={key}
                    body={
                      <span>
                        <span className="font-quote text-lg font-light text-quote">{q.text}</span>
                        {q.author && (
                          <span className="mt-1 block text-xs uppercase tracking-wide2 text-[color:var(--accent)]/80">
                            {q.author}
                          </span>
                        )}
                      </span>
                    }
                    meta={q.windowLabel ? `${t("suggestedWindow")} · ${q.windowLabel}` : ""}
                    added={added.has(key)}
                    onAdd={() => keep(key, q.text, q.author)}
                  />
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function Card({
  body,
  meta,
  added,
  onAdd,
}: {
  body: React.ReactNode;
  meta: string;
  added: boolean;
  onAdd: () => void;
}) {
  const t = useT();
  return (
    <div className="animate-rise flex items-start gap-3 rounded-2xl border border-stone-700/60 bg-stone-850 p-4">
      <div className="min-w-0 flex-1 leading-relaxed tracking-breathe">
        {body}
        {meta && <p className="mt-2 text-[11px] tracking-breathe text-mist-faint">{meta}</p>}
      </div>
      <button
        onClick={onAdd}
        disabled={added}
        className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs tracking-wide2 transition-colors ${
          added
            ? "border border-stone-700 text-mist-faint"
            : "bg-[color:var(--accent)] text-stone-950"
        }`}
      >
        {added ? t("added") : <><Plus /> {t("add")}</>}
      </button>
    </div>
  );
}
