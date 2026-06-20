#!/usr/bin/env node
// sync-quotes-feed — compile the vault's saved quotes into Le Galet's feed.
//
// Source (vault):  ~/Claude/wiki/quotes/*.md
//   Markdown with frontmatter written by the magazines' "Save to quotes" button:
//     ---
//     type: quote
//     text: "Most creativity is curation."
//     author: "David Byrne"
//     source_publication: "Kottke"
//     saved_from: "les-marges-2026-05-06"
//     saved_at: "2026-05-08"
//     ---
//
// Output (this repo):  public/quotes-feed.json
//   A flat array the running PWA fetches on load and imports into its local
//   Dexie store (see src/feed.ts). Each item carries a stable content-hash id so
//   the client can import only what's new and never resurrect a deleted quote:
//     [{ "id": "a1b2c3d4", "text": "...", "author": "...", "source": "les-marges-..." }]
//
// Behavior: rebuild the feed from the wiki; if it changed, commit + push so
// Netlify redeploys and the kitchen iPad picks the new quotes up on next load.
//
// Runs under launchd (com.jacquesgautreau.sync-galet-quotes), same cadence family
// as the dashboard's sync-quotes.

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, '..');                 // apps/le-galet
const VAULT = resolve(REPO, '..', '..');               // ~/Claude  (apps/le-galet → apps → Claude)
const WIKI_QUOTES = join(VAULT, 'wiki', 'quotes');
const TARGET = join(REPO, 'public', 'quotes-feed.json');

function ts() { return new Date().toISOString().replace('T', ' ').slice(0, 19); }
function log(m) { console.log(`[${ts()}] ${m}`); }

function run(cmd, args, opts = {}) {
  return execFileSync(cmd, args, {
    cwd: REPO,
    stdio: opts.pipe ? 'pipe' : 'inherit',
    encoding: 'utf-8',
    env: {
      ...process.env,
      PATH: '/opt/homebrew/bin:/opt/homebrew/opt/node@22/bin:/usr/bin:/bin',
    },
    ...opts,
  });
}

// --- frontmatter parser (no dep) ---
function parseFrontmatter(md) {
  if (!md.startsWith('---')) return null;
  const end = md.indexOf('\n---', 3);
  if (end < 0) return null;
  const block = md.slice(4, end).trim();
  const fm = {};
  for (const line of block.split('\n')) {
    const m = line.match(/^([a-zA-Z_][a-zA-Z0-9_-]*):\s*(.*)$/);
    if (!m) continue;
    let value = m[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    fm[m[1]] = value;
  }
  return fm;
}

// FNV-1a 32-bit, hex. Stable across runs → the client's "already imported" set
// keys off this, so re-running the sync never duplicates a quote.
function hashId(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

const normKey = (t) => t.trim().toLowerCase().replace(/\s+/g, ' ');

function readWikiQuotes() {
  if (!existsSync(WIKI_QUOTES)) return [];
  const out = [];
  const seen = new Set();
  for (const f of readdirSync(WIKI_QUOTES).sort()) {
    if (!f.endsWith('.md') || f === 'index.md' || f === 'README.md') continue;
    const fm = parseFrontmatter(readFileSync(join(WIKI_QUOTES, f), 'utf-8'));
    if (!fm || fm.type !== 'quote') continue;
    const text = (fm.text || '').trim();
    if (!text) continue;
    const author = (fm.author || fm.source_publication || '').trim();
    const key = normKey(text);
    if (seen.has(key)) continue;            // collapse exact-text duplicates
    seen.add(key);
    out.push({ id: hashId(key), text, author, source: (fm.saved_from || 'wiki').trim() });
  }
  return out;
}

try {
  log('building Le Galet quote feed');
  const feed = readWikiQuotes();
  log(`  ${feed.length} quotes from ${WIKI_QUOTES}`);

  const next = JSON.stringify(feed, null, 2) + '\n';
  const prev = existsSync(TARGET) ? readFileSync(TARGET, 'utf-8') : '';
  if (next === prev) {
    log('no feed changes — exiting clean');
    process.exit(0);
  }

  mkdirSync(dirname(TARGET), { recursive: true });
  writeFileSync(TARGET, next);
  log('quotes-feed.json updated');

  // From here on: commit + push so Netlify redeploys. Guarded so a dirty repo
  // (stray .DS_Store, app edits in flight) never gets swept into the commit —
  // we only ever stage the feed file.
  try {
    run('git', ['pull', '--rebase', '--autostash', 'origin', 'main']);
  } catch {
    log('ERROR: git pull --rebase failed');
    try { run('git', ['rebase', '--abort'], { pipe: true }); } catch {}
    process.exit(1);
  }

  run('git', ['add', 'public/quotes-feed.json']);
  try {
    run('git', ['diff', '--cached', '--quiet', '--', 'public/quotes-feed.json'], { pipe: true });
    log('no staged changes after rebase — exiting clean');
    process.exit(0);
  } catch (err) {
    if (err.status !== 1) throw err;
  }

  run('git', ['commit', '-m', `Sync quote feed (${feed.length} quotes from wiki)`]);
  try {
    run('git', ['push', 'origin', 'main']);
  } catch {
    log('ERROR: git push failed');
    process.exit(1);
  }
  log('pushed quote-feed sync');
} catch (err) {
  log(`ERROR: ${err.message}`);
  process.exit(1);
}
