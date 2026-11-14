// Records the server's answers for every date of every game level, so the game also works
// without a server (docs/design/mini-oyun.md, section 7: "seviyelerin yanıtları önceden
// kaydedilmiş olmalı"). Only the fields the game reads are kept.
//
// Usage, with the server running on port 8000:
//   node frontend/src/features/game/record-answers.mjs [http://127.0.0.1:8000]
//
// Writes frontend/src/features/game/recorded-answers.json.

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const base = (process.argv[2] ?? 'http://127.0.0.1:8000').replace(/\/$/, '');
const here = (name) => fileURLToPath(new URL(name, import.meta.url));
const content = JSON.parse(readFileSync(here('../../content/game-levels.json'), 'utf8'));

const DAY_MS = 86_400_000;
const utc = (ms) => new Date(ms).toISOString().replace('.000Z', 'Z');

function dates(level) {
  const out = [];
  for (let t = Date.parse(`${level.date_min}T00:00:00Z`); t <= Date.parse(`${level.date_max}T00:00:00Z`); t += DAY_MS) out.push(t);
  return out;
}

const answers = {};
for (const level of content.levels) {
  answers[level.id] = {};
  for (const start of dates(level)) {
    const query = new URLSearchParams({
      site_id: level.site_id,
      start_utc: utc(start),
      end_utc: utc(start + content.mission_days * DAY_MS),
      mast_height_m: String(content.mast_height_m),
    });
    const response = await fetch(`${base}/api/events?${query}`);
    if (!response.ok) throw new Error(`${level.id} ${utc(start)}: HTTP ${response.status} ${await response.text()}`);
    const body = await response.json();
    const { sunlit_fraction, longest_dark_hours, earth_visible_fraction } = body.metrics;
    answers[level.id][utc(start).slice(0, 10)] = {
      metrics: { sunlit_fraction, longest_dark_hours, earth_visible_fraction },
      validity: body.validity,
      relay_status: body.relay_status ?? null,
    };
  }
  process.stdout.write(`${level.id}: ${Object.keys(answers[level.id]).length} dates\n`);
}

let commit = null;
try {
  commit = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
} catch {
  // Not in a git checkout: the commit stays unknown.
}

const out = {
  _about:
    'Server answers of /api/events for every date of every game level, recorded by record-answers.mjs. Used in example mode only; live mode asks the server.',
  recorded_utc: utc(Date.now()).slice(0, 17) + '00Z',
  server_commit: commit,
  mission_days: content.mission_days,
  mast_height_m: content.mast_height_m,
  answers,
};
writeFileSync(here('recorded-answers.json'), `${JSON.stringify(out, null, 2)}\n`);
process.stdout.write('wrote recorded-answers.json\n');
