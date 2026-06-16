import { createContext, useContext, type ReactNode } from "react";

export type Lang = "fr" | "en";

// Le Galet is French-first. Strings carry both tongues; the UI defaults to FR.
const STRINGS = {
  // Shell / navigation
  appName: { fr: "Le Galet", en: "Le Galet" },
  tagline: {
    fr: "un foyer calme",
    en: "a calm hearth",
  },
  compose: { fr: "Composer", en: "Compose" },
  settings: { fr: "Réglages", en: "Settings" },
  souffleur: { fr: "Souffleur", en: "Souffleur" },
  back: { fr: "Retour", en: "Back" },
  done: { fr: "Terminé", en: "Done" },
  drift: { fr: "Laisser dériver", en: "Let it drift" },
  fullscreen: { fr: "Plein écran", en: "Fullscreen" },

  // Galet (idle) overlay
  tapToCurate: { fr: "Toucher pour composer", en: "Tap to compose" },
  emptyTitle: { fr: "Le galet est lisse et vide.", en: "The pebble is smooth and empty." },
  emptyBody: {
    fr: "Ajoutez une photo, une pensée ou un petit rappel — puis laissez l'écran dériver.",
    en: "Add a photo, a thought, or a small reminder — then let the screen drift.",
  },
  startComposing: { fr: "Commencer", en: "Begin" },

  // Composer
  composerTitle: { fr: "Composer le galet", en: "Compose the pebble" },
  composerSub: {
    fr: "Ce qui suit dérive sur l'écran, un seul à la fois. Glissez pour réordonner.",
    en: "These drift across the screen, one at a time. Drag to reorder.",
  },
  addPhoto: { fr: "Photo", en: "Photo" },
  addQuote: { fr: "Citation", en: "Quote" },
  addReminder: { fr: "Rappel", en: "Reminder" },
  nothingYet: { fr: "Rien encore dans le galet.", en: "Nothing in the pebble yet." },
  entries_one: { fr: "1 élément", en: "1 item" },
  entries_other: { fr: "{n} éléments", en: "{n} items" },
  weight: { fr: "Fréquence", en: "Frequency" },
  rare: { fr: "rare", en: "rare" },
  often: { fr: "souvent", en: "often" },
  edit: { fr: "Modifier", en: "Edit" },
  remove: { fr: "Retirer", en: "Remove" },
  hide: { fr: "Masquer", en: "Hide" },
  show: { fr: "Afficher", en: "Show" },
  bySouffleur: { fr: "soufflé", en: "by souffleur" },

  // Editors
  quoteTitle: { fr: "Une pensée, une parole", en: "A thought, a saying" },
  quotePlaceholder: { fr: "Écrivez ici…", en: "Write here…" },
  authorPlaceholder: { fr: "— à qui ? (facultatif)", en: "— by whom? (optional)" },
  reminderTitle: { fr: "Un petit rappel", en: "A small reminder" },
  reminderPlaceholder: { fr: "Arroser les plantes…", en: "Water the plants…" },
  captionTitle: { fr: "Légende (facultatif)", en: "Caption (optional)" },
  captionPlaceholder: { fr: "Été 2019, le chalet…", en: "Summer 2019, the cabin…" },
  whenWindow: { fr: "Quand l'afficher", en: "When to show it" },
  always: { fr: "Toujours", en: "Always" },
  from: { fr: "Du", en: "From" },
  to: { fr: "au", en: "to" },
  recurrence: { fr: "Répétition", en: "Repeat" },
  rec_once: { fr: "Une fois", en: "Once" },
  rec_daily: { fr: "Chaque jour", en: "Daily" },
  rec_weekly: { fr: "Chaque semaine", en: "Weekly" },
  rec_yearly: { fr: "Chaque année", en: "Yearly" },
  save: { fr: "Garder", en: "Keep" },
  cancel: { fr: "Annuler", en: "Cancel" },
  chooseImage: { fr: "Choisir une image", en: "Choose an image" },

  // Réglages
  reglagesTitle: { fr: "Le souffle du galet", en: "The breath of the pebble" },
  pace: { fr: "Le rythme", en: "Pace" },
  fade: { fr: "Durée du fondu", en: "Fade duration" },
  dwell: { fr: "Temps de repos", en: "Dwell time" },
  seconds: { fr: "s", en: "s" },
  order: { fr: "L'ordre", en: "Order" },
  shuffleOn: { fr: "Aléatoire (selon la fréquence)", en: "Shuffle (by frequency)" },
  shuffleOff: { fr: "Dans l'ordre composé", en: "In composed order" },
  rhythmNight: { fr: "Le jour et la nuit", en: "Day & night" },
  dayStart: { fr: "Réveil de l'écran", en: "Screen wakes" },
  nightStart: { fr: "L'écran se tamise", en: "Screen dims" },
  nightDim: { fr: "Pénombre de nuit", en: "Night dimness" },
  texture: { fr: "La texture", en: "Texture" },
  kenBurns: { fr: "Lente dérive sur les photos", en: "Slow drift on photos" },
  showClock: { fr: "Heure discrète", en: "Quiet clock" },
  household: { fr: "Le foyer", en: "Household" },
  toneLabel: { fr: "L'air de la maison", en: "The mood of the home" },
  tonePlaceholder: {
    fr: "p. ex. une famille calme, deux enfants, on aime les mots doux et la mer…",
    en: "e.g. a calm family, two kids, fond of gentle words and the sea…",
  },
  toneHelp: {
    fr: "Le Souffleur s'en sert pour proposer des mots qui vous ressemblent.",
    en: "The Souffleur uses this to suggest words that feel like you.",
  },
  language: { fr: "Langue", en: "Language" },

  // Souffleur
  souffleurTitle: { fr: "Le Souffleur", en: "The Souffleur" },
  souffleurSub: {
    fr: "Une voix discrète qui souffle un mot de saison et quelques citations qui résonnent avec le jour. Vous choisissez ce qui reste.",
    en: "A quiet voice that offers a seasonal greeting and a few quotes that resonate with the day. You choose what stays.",
  },
  conjure: { fr: "Souffler des idées", en: "Offer suggestions" },
  conjuring: { fr: "Le souffleur réfléchit…", en: "The souffleur is thinking…" },
  again: { fr: "Encore", en: "Again" },
  greetings: { fr: "Salutations de saison", en: "Seasonal greetings" },
  quotes: { fr: "Citations qui résonnent", en: "Resonant quotes" },
  add: { fr: "Ajouter", en: "Add" },
  added: { fr: "Ajouté", en: "Added" },
  suggestedWindow: { fr: "fenêtre suggérée", en: "suggested window" },
  souffleurError: {
    fr: "Le souffleur s'est tu un instant. Réessayez.",
    en: "The souffleur went quiet for a moment. Try again.",
  },

  // Onboarding
  ob1Title: { fr: "Voici Le Galet.", en: "Meet Le Galet." },
  ob1Body: {
    fr: "Une vieille tablette devient un foyer calme — vos photos, vos pensées et vos petits rappels dérivent lentement, un seul à la fois.",
    en: "An old tablet becomes a calm hearth — your photos, thoughts, and small reminders drift slowly, one at a time.",
  },
  ob2Title: { fr: "Composez votre galet.", en: "Compose your pebble." },
  ob2Body: {
    fr: "Déposez quelques photos, écrivez une parole, glissez un rappel. Tout reste sur cet appareil.",
    en: "Drop in a few photos, write a saying, slip in a reminder. Everything stays on this device.",
  },
  ob3Title: { fr: "Puis posez-le et oubliez-le.", en: "Then prop it up and forget it." },
  ob3Body: {
    fr: "L'écran s'illumine au déjeuner et se tamise le soir. Aucune notification, aucune décision — juste une chose calme à la fois.",
    en: "It brightens at breakfast and dims at night. No notifications, no decisions — just one calm thing at a time.",
  },
  next: { fr: "Suivant", en: "Next" },
  begin: { fr: "Laisser dériver", en: "Let it drift" },
  skip: { fr: "Passer", en: "Skip" },
} as const;

type Key = keyof typeof STRINGS;

const LangContext = createContext<Lang>("fr");

export function LangProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>;
}

export function useLang(): Lang {
  return useContext(LangContext);
}

export function useT() {
  const lang = useContext(LangContext);
  return (key: Key, vars?: Record<string, string | number>): string => {
    let s: string = STRINGS[key][lang];
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
    return s;
  };
}

// Plural helper for the "{n} items" count.
export function plural(lang: Lang, n: number): string {
  if (n === 1) return STRINGS.entries_one[lang];
  return STRINGS.entries_other[lang].replace("{n}", String(n));
}
