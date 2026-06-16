# Le Galet

> Une tablette oisive devient un foyer calme qui dérive lentement à travers vos
> photos, citations et rappels — un seul à la fois, avec de longs fondus doux.

Le Galet turns an idle kitchen iPad (or any always-on screen) into a calm,
breathing family display. A parent curates a single rotating "pebble" of
moments — family snapshots, hand-picked quotes, gentle time-aware reminders —
then props the screen up and lets it drift. No notifications, no scrolling, no
decisions: just one calm thing at a time, dimming itself at night and
brightening at breakfast.

## The pebble engine (signature)

Every item dwells, then dissolves into the next over several seconds. Photos get
a slow Ken Burns drift on a softly-blurred bed; quotes are set large in a
humanist serif; reminders appear only inside their time window. The whole
display eases darker and shifts its single accent from warm **amber** (day) to
cool **slate** (night) across a soft threshold, with a faint resting clock and a
subtle vignette — the mood of a candle-lit shelf, never a screen demanding to be
read. A Screen Wake Lock keeps the kitchen tablet awake while it drifts.

## Le Souffleur (AI)

An optional, gentle AI host. Given the season, the day, and the household's
described tone, it whispers a few seasonal greeting cards and resonant quotes
(with a suggested time window) — you choose what to keep. Runs Opus with forced
tool-use behind `/api/souffleur`, streamed over NDJSON so long calls never time
out.

## Stack

Vite + React 19 + TypeScript + Tailwind v3 + Dexie (IndexedDB, fully local) +
Netlify Functions calling the Claude API. Installable as a fullscreen PWA with an
offline app-shell service worker. French-first (Québécois), with English.
Everything you add stays on the device.

## Develop

```
npm install
npm run dev        # netlify dev (functions + app)
npm run dev:vite   # app only
npm run build
```

The Souffleur needs `CLAUDE_API_KEY` set in the Netlify environment.
