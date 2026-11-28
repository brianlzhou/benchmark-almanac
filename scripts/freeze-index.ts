// Freezes the Almanac Index's version for this month. The site build writes the version in force to
// dist/index/recipe.json (src/pages/index/recipe.json.ts). When data/index/ has no file for that version yet, this
// copies it there with today's date, and the sync's pull request carries it. From then on the version's tests,
// weights and boards stay as they were, and only the scores move.
//
// It also keeps the standings the last version ended on, in data/index/standings/YY.MM.json, read from the
// build's /index/data.json.
//
//   node scripts/freeze-index.ts            (after npm run build)
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './lib/util.ts';

const recipePath = join(ROOT, 'dist', 'index', 'recipe.json');
const pagePath = join(ROOT, 'dist', 'index', 'data.json');
if (!existsSync(recipePath)) {
  console.log('Almanac Index: no dist/index/recipe.json, so nothing to freeze. Run npm run build first.');
  process.exit(0);
}
const text = readFileSync(recipePath, 'utf8');
const recipe = JSON.parse(text) as { version: string; frozen: string | null };
const out = join(ROOT, 'data', 'index', `${recipe.version}.json`);
if (existsSync(out)) {
  console.log(`Almanac Index: version ${recipe.version} is already frozen.`);
  process.exit(0);
}
const today = new Date().toISOString().slice(0, 10);
// the build serialized it one entry per line, so only the two stamps change
writeFileSync(out, text.replace('"frozen": null', `"frozen": ${JSON.stringify(today)}`).replace('"rebuilt": true', '"rebuilt": false'));
console.log(`Almanac Index: froze version ${recipe.version} on ${today}.`);

// the standings the version before it ended on, ranked with the scores of the day it was replaced
if (existsSync(pagePath)) {
  const page = JSON.parse(readFileSync(pagePath, 'utf8')) as { order: string[]; asOf: string; versions: Record<string, { headline: { rows: { m: string; rank: number; v: number }[] } }> };
  const prev = page.order[page.order.indexOf(recipe.version) - 1];
  if (prev) {
    mkdirSync(join(ROOT, 'data', 'index', 'standings'), { recursive: true });
    const rows = page.versions[prev].headline.rows.map((r) => [r.rank, r.m, r.v]);
    writeFileSync(join(ROOT, 'data', 'index', 'standings', `${prev}.json`), `{\n  "version": ${JSON.stringify(prev)},\n  "asOf": ${JSON.stringify(page.asOf)},\n  "rows": [\n${rows.map((r) => `    ${JSON.stringify(r)}`).join(',\n')}\n  ]\n}\n`);
    console.log(`Almanac Index: kept version ${prev}'s final standings (${rows.length} models).`);
  }
}
