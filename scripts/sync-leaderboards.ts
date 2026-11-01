// Reads every official leaderboard importer in scripts/leaderboards/ and writes
// data/scores/leaderboards.json. Model names map to data/models.json through the shared resolver plus each
// importer's own aliases. A board that fails keeps its last rows, so one broken site never empties the data.
//
// usage: node scripts/sync-leaderboards.ts [--only id,id] [--dry]
import { readdirSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT, dataPath, readJson, today } from './lib/util.ts';
import { makeResolver } from './lib/models.ts';
import type { Leaderboard } from './leaderboards/types.ts';

// benchmark, model, setting, harness, score, date, cost (US dollars per task), tokens (output tokens per task)
type Row = [string, string, string | null, string | null, number, string | null, number | null, number | null];
const COLUMNS = ['benchmark', 'model', 'setting', 'harness', 'score', 'date', 'cost', 'tokens'];
interface Store {
  retrieved: string | null;
  boards: Record<string, { url: string; feed: string; terms: string; retrieved: string; rows: number; unmatched: string[] }>;
  columns: string[];
  rows: Row[];
}

const arg = (k: string) => {
  const i = process.argv.indexOf(k);
  return i > 0 ? process.argv[i + 1] : undefined;
};
const only = arg('--only')?.split(',');
const dry = process.argv.includes('--dry');

const outPath = dataPath('scores', 'leaderboards.json');
const store: Store = existsSync(outPath)
  ? readJson<Store>(outPath)
  : { retrieved: null, boards: {}, columns: COLUMNS, rows: [] };
const benchmarks = new Set(readJson<{ id: string }[]>(dataPath('benchmarks.json')).map((b) => b.id));
const released = new Map(readJson<{ id: string; released?: string }[]>(dataPath('models.json')).map((m) => [m.id, m.released]));

const dir = join(ROOT, 'scripts', 'leaderboards');
const files = readdirSync(dir).filter((f) => f.endsWith('.ts') && f !== 'types.ts');
let failed = 0;
for (const f of files) {
  const board = (await import(pathToFileURL(join(dir, f)).href)).default as Leaderboard;
  if (only && !only.includes(board.benchmark) && !only.includes(f.replace(/\.ts$/, ''))) continue;
  if (!benchmarks.has(board.benchmark)) {
    console.log(`  ${f}: unknown benchmark ${board.benchmark}`);
    failed++;
    continue;
  }
  const resolve = makeResolver(board.aliases ?? {});
  try {
    const raw = await board.fetch();
    const rows: Row[] = [];
    const unmatched = new Set<string>();
    for (const r of raw) {
      if (!Number.isFinite(r.score)) continue;
      const hit = resolve(r.model, r.date);
      if (!hit) {
        unmatched.add(r.model);
        continue;
      }
      // place the score at the model's release, like Epoch, so charts over time line up
      const date = released.get(hit.id) ?? r.date ?? null;
      const cost = typeof r.cost === 'number' && r.cost > 0 ? Number(r.cost.toPrecision(4)) : null;
      const tokens = typeof r.tokens === 'number' && r.tokens > 0 ? Math.round(r.tokens) : null;
      rows.push([board.benchmark, hit.id, r.setting ?? hit.setting ?? null, r.harness ?? null, Math.round(r.score * 100) / 100, date, cost, tokens]);
    }
    console.log(`  ${board.benchmark}: ${raw.length} rows, ${rows.length} matched${unmatched.size ? `, unmatched: ${[...unmatched].slice(0, 12).join(' | ')}` : ''}`);
    if (dry) {
      for (const r of rows.sort((a, b) => b[4] - a[4]).slice(0, 8)) console.log(`      ${r[4]}  ${r[1]}${r[2] ? ` (${r[2]})` : ''}${r[3] ? ` [${r[3]}]` : ''}`);
      continue;
    }
    if (!rows.length) throw new Error('no rows matched');
    store.rows = store.rows.filter((r) => r[0] !== board.benchmark).concat(rows);
    store.boards[board.benchmark] = { url: board.url, feed: board.feed, terms: board.terms, retrieved: today(), rows: rows.length, unmatched: [...unmatched].sort() };
  } catch (e) {
    failed++;
    console.log(`  ${board.benchmark}: failed, keeping the last rows (${(e as Error).message})`);
  }
}

if (!dry) {
  store.retrieved = today();
  store.columns = COLUMNS;
  // rows kept from a board that failed may predate the cost and tokens columns
  store.rows = store.rows.map((r) => [...r.slice(0, 6), r[6] ?? null, r[7] ?? null] as Row);
  store.rows.sort((a, b) => a[0].localeCompare(b[0]) || (a[5] ?? '').localeCompare(b[5] ?? '') || a[1].localeCompare(b[1]));
  const boards = Object.fromEntries(Object.entries(store.boards).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(
    outPath,
    `{\n  "retrieved": ${JSON.stringify(store.retrieved)},\n  "boards": ${JSON.stringify(boards, null, 2).replace(/\n/g, '\n  ')},\n  "columns": ${JSON.stringify(store.columns)},\n  "rows": [\n${store.rows.map((r) => `    ${JSON.stringify(r)}`).join(',\n')}\n  ]\n}\n`,
  );
  console.log(`Wrote ${store.rows.length} leaderboard scores from ${Object.keys(store.boards).length} boards.${failed ? ` ${failed} failed.` : ''}`);
}
