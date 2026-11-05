// Reads every official leaderboard importer in scripts/leaderboards/ and writes
// data/scores/leaderboards.json. Model names map to data/models.json through the shared resolver plus each
// importer's own aliases. Entries the resolver cannot place (fine-tunes, agent systems, products, older models)
// go to `others` under the board's own name, so a benchmark page can still show the whole board. Only `rows`
// count toward leaders and lab credit. In `rows` the date is the model's release (so charts line up with Epoch);
// in `others`, which have no model record, it is the date the board gives, if any. A board that fails keeps its last rows, so one broken site never empties
// the data.
//
// usage: node scripts/sync-leaderboards.ts [--only id,id] [--dry] [--allow-drop]
import { readdirSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT, dataPath, readJson, today } from './lib/util.ts';
import { makeResolver } from './lib/models.ts';
import type { Leaderboard } from './leaderboards/types.ts';

// benchmark, model, setting, harness, score, date, cost (US dollars per task), tokens (output tokens per task),
// and metrics (other numbers the board reports, such as latency) when it has any
type Metrics = Record<string, number>;
type Row = [string, string, string | null, string | null, number, string | null, number | null, number | null, Metrics?];
const COLUMNS = ['benchmark', 'model', 'setting', 'harness', 'score', 'date', 'cost', 'tokens', 'metrics'];
// the same columns, with the board's own name for the entry in place of a model id
const OTHER_COLUMNS = ['benchmark', 'name', 'setting', 'harness', 'score', 'date', 'cost', 'tokens', 'metrics'];
interface Store {
  retrieved: string | null;
  boards: Record<string, { url: string; feed: string; terms: string; retrieved: string; rows: number; unmatched: string[]; chart?: Leaderboard['chart']; costPer?: 'run' }>;
  columns: string[];
  rows: Row[];
  otherColumns?: string[];
  others?: Row[];
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
const seen = new Set<string>();
for (const f of files) {
  let board: Leaderboard | undefined;
  try {
    board = (await import(pathToFileURL(join(dir, f)).href)).default as Leaderboard | undefined;
  } catch (e) {
    // one importer that does not load must not stop the others
    console.log(`  ${f}: failed to load (${(e as Error).message})`);
    failed++;
    continue;
  }
  if (!board?.benchmark || typeof board.fetch !== 'function') {
    console.log(`  ${f}: has no default-exported Leaderboard`);
    failed++;
    continue;
  }
  seen.add(board.benchmark).add(f.replace(/\.ts$/, ''));
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
    const others: Row[] = [];
    const unmatched = new Set<string>();
    for (const r of raw) {
      if (!Number.isFinite(r.score)) continue;
      const cost = typeof r.cost === 'number' && r.cost > 0 ? Number(r.cost.toPrecision(4)) : null;
      const tokens = typeof r.tokens === 'number' && r.tokens > 0 ? Math.round(r.tokens) : null;
      // two decimals, or four for scores under 10, so a 0-to-1 board keeps 0.602 apart from 0.600
      const score = Math.abs(r.score) < 10 ? Math.round(r.score * 1e4) / 1e4 : Math.round(r.score * 100) / 100;
      const metrics = Object.fromEntries(Object.entries(r.metrics ?? {}).filter(([, v]) => Number.isFinite(v)).map(([k, v]) => [k, Number(v.toPrecision(5))]));
      const extra: [Metrics?] = Object.keys(metrics).length ? [metrics] : [];
      const hit = resolve(r.model, r.date);
      if (!hit) {
        unmatched.add(r.model);
        const name = r.model.replace(/\s+/g, ' ').trim();
        if (name) others.push([board.benchmark, name, r.setting ?? null, r.harness ?? null, score, r.date ?? null, cost, tokens, ...extra]);
        continue;
      }
      // place the score at the model's release, like Epoch, so charts over time line up
      const date = released.get(hit.id) ?? r.date ?? null;
      rows.push([board.benchmark, hit.id, r.setting ?? hit.setting ?? null, r.harness ?? null, score, date, cost, tokens, ...extra]);
    }
    console.log(`  ${board.benchmark}: ${raw.length} rows, ${rows.length} matched${unmatched.size ? `, unmatched: ${[...unmatched].slice(0, 12).join(' | ')}` : ''}`);
    if (dry) {
      for (const r of rows.sort((a, b) => b[4] - a[4]).slice(0, 8)) console.log(`      ${r[4]}  ${r[1]}${r[2] ? ` (${r[2]})` : ''}${r[3] ? ` [${r[3]}]` : ''}`);
      continue;
    }
    if (!rows.length && !others.length) throw new Error('no rows');
    // a parser that breaks quietly often returns a handful of rows: keep the last good board instead
    const before = store.rows.filter((r) => r[0] === board.benchmark).length + (store.others ?? []).filter((r) => r[0] === board.benchmark).length;
    const now = rows.length + others.length;
    if (before >= 20 && now < before / 2 && !process.argv.includes('--allow-drop'))
      throw new Error(`${now} entries against ${before} last time; rerun with --allow-drop if the board really shrank`);
    store.rows = store.rows.filter((r) => r[0] !== board.benchmark).concat(rows);
    store.others = (store.others ?? []).filter((r) => r[0] !== board.benchmark).concat(others);
    store.boards[board.benchmark] = { url: board.url, feed: board.feed, terms: board.terms, retrieved: today(), rows: rows.length, unmatched: [...unmatched].sort(), ...(board.chart ? { chart: board.chart } : {}), ...(board.costPer === 'run' ? { costPer: 'run' as const } : {}) };
  } catch (e) {
    failed++;
    console.log(`  ${board.benchmark}: failed, keeping the last rows (${(e as Error).message})`);
  }
}

const unknown = (only ?? []).filter((id) => !seen.has(id));
if (unknown.length) {
  console.log(`No importer for: ${unknown.join(', ')}`);
  process.exit(1);
}

if (!dry) {
  // on a full run, a board whose importer file is gone loses its rows
  if (!only)
    for (const id of Object.keys(store.boards))
      if (!seen.has(id)) {
        console.log(`  ${id}: no importer any more, rows removed`);
        delete store.boards[id];
      }
  store.rows = store.rows.filter((r) => store.boards[r[0]]);
  store.retrieved = today();
  store.columns = COLUMNS;
  // rows kept from a board that failed may predate the cost and tokens columns
  store.rows = store.rows.map((r) => [...r.slice(0, 6), r[6] ?? null, r[7] ?? null, ...(r[8] ? [r[8]] : [])] as Row);
  store.rows.sort((a, b) => a[0].localeCompare(b[0]) || (a[5] ?? '').localeCompare(b[5] ?? '') || a[1].localeCompare(b[1]));
  const others = (store.others ?? []).filter((r) => store.boards[r[0]]);
  others.sort((a, b) => a[0].localeCompare(b[0]) || b[4] - a[4] || a[1].localeCompare(b[1]));
  const boards = Object.fromEntries(Object.entries(store.boards).sort(([a], [b]) => a.localeCompare(b)));
  const lines = (rs: Row[]) => rs.map((r) => `    ${JSON.stringify(r)}`).join(',\n');
  writeFileSync(
    outPath,
    `{\n  "retrieved": ${JSON.stringify(store.retrieved)},\n  "boards": ${JSON.stringify(boards, null, 2).replace(/\n/g, '\n  ')},\n  "columns": ${JSON.stringify(store.columns)},\n  "rows": [\n${lines(store.rows)}\n  ],\n  "otherColumns": ${JSON.stringify(OTHER_COLUMNS)},\n  "others": [\n${lines(others)}\n  ]\n}\n`,
  );
  console.log(`Wrote ${store.rows.length} leaderboard scores and ${others.length} unlisted entries from ${Object.keys(store.boards).length} boards.${failed ? ` ${failed} failed.` : ''}`);
}
// a few boards fail on any day (sites go down). More than a tenth failing means something broader broke.
if (failed > files.length / 10) {
  console.log(`${failed} of ${files.length} importers failed.`);
  process.exit(1);
}
