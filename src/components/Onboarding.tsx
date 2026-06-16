import { useState } from "react";
import { useT } from "../i18n";
import { Drift } from "./Icons";

// Light, skippable. Three slow breaths, then it gets out of the way for good.
export default function Onboarding({ onDone }: { onDone: () => void }) {
  const t = useT();
  const [step, setStep] = useState(0);
  const steps = [
    { title: t("ob1Title"), body: t("ob1Body") },
    { title: t("ob2Title"), body: t("ob2Body") },
    { title: t("ob3Title"), body: t("ob3Body") },
  ];
  const last = step === steps.length - 1;

  return (
    <div className="vignette fixed inset-0 z-[60] flex flex-col items-center justify-center bg-stone-900 px-8 text-center">
      <button
        onClick={onDone}
        className="absolute right-6 top-6 text-xs uppercase tracking-wide3 text-mist-faint transition-colors hover:text-mist"
      >
        {t("skip")}
      </button>

      <div key={step} className="animate-rise max-w-md">
        <div className="mb-8 text-[color:var(--accent)]">
          <Drift className="mx-auto text-5xl" />
        </div>
        <h2 className="font-quote text-3xl font-light leading-snug tracking-breathe text-mist">
          {steps[step].title}
        </h2>
        <p className="mx-auto mt-5 max-w-sm text-[15px] font-light leading-relaxed tracking-breathe text-mist-soft">
          {steps[step].body}
        </p>
      </div>

      <div className="mt-12 flex items-center gap-3">
        {steps.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              i === step ? "w-6 bg-[color:var(--accent)]" : "w-1.5 bg-stone-700"
            }`}
          />
        ))}
      </div>

      <button
        onClick={() => (last ? onDone() : setStep((s) => s + 1))}
        className="mt-9 rounded-full bg-[color:var(--accent)] px-8 py-3 text-sm font-medium tracking-wide2 text-stone-950"
      >
        {last ? t("begin") : t("next")}
      </button>
    </div>
  );
}
