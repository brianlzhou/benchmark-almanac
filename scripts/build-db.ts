// Builds public/data/almanac.db (and a gzipped copy) from data/: every lab, model, benchmark, leaderboard, score
// and lab document as one SQLite database. The /sql/ page queries it in the reader's browser, and readers can
// download it. data/ stays the source of truth: the file is rebuilt before every site build (npm "prebuild") and
// is never committed.
//
//   node scripts/build-db.ts            build it
//   node scripts/build-db.ts --check    build it, then run every example query on the /sql/ page
//
// It uses Node's own SQLite module (node:sqlite, Node 22.13 or later), so it needs no dependency. The tables and
// the credit text live in src/lib/db-schema.ts, which the /sql/ page also reads.
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { ROOT, dataPath, readJson } from './lib/util.ts';
import { TABLES, VIEWS, EXAMPLES, CREDIT_LINE, HOW_TO_CREDIT, LICENSE_NOTE, DATES_NOTE, SITE_URL, citation } from '../src/lib/db-schema.ts';

const OUT_DIR = join(ROOT, 'public', 'data');
const OUT = join(OUT_DIR, 'almanac.db');

type Json = Record<string, any>;
const labs = readJson<Json[]>(dataPath('labs.json'));
const models = readJson<Json[]>(dataPath('models.json'));
const benchmarks = readJson<Json[]>(dataPath('benchmarks.json'));
const launch = readJson<Json[]>(dataPath('cards.json'));
const docs = readJson<Json[]>(dataPath('system-cards.json'));
const epoch = readJson<Json>(dataPath('scores', 'epoch.json'));
const lb = readJson<Json>(dataPath('scores', 'leaderboards.json'));
const abstracts = readJson<Record<string, Json>>(dataPath('abstracts.json'));
const github = readJson<Record<string, Json>>(dataPath('github.json'));

// ---- the taxonomy's names, read from the site's module, which Node cannot import (it imports JSON bare) ----
const taxSrc = readFileSync(join(ROOT, 'src', 'lib', 'taxonomy.ts'), 'utf8');
const CATEGORY_NAME = Object.fromEntries([...(taxSrc.match(/CATEGORY_NAMES[^{]*\{([^}]*)\}/)?.[1] ?? '').matchAll(/'([\w-]+)':\s*'([^']+)'/g)].map((m) => [m[1], m[2]]));
const AREA_OF = new Map<string, string>();
for (const m of taxSrc.matchAll(/id:\s*'([\w-]+)',\s*name:\s*'[^']*',[\s\S]*?categories:\s*\[([^\]]*)\]/g)) for (const cat of m[2].matchAll(/'([\w-]+)'/g)) AREA_OF.set(cat[1], m[1]);
if (AREA_OF.size < 10) throw new Error('build-db: could not read the areas from src/lib/taxonomy.ts');
const areaOf = (category?: string) => (category && AREA_OF.get(category)) || 'other';

// ---- the rules the site uses (src/lib/data.ts), repeated here for a plain Node script ----------------------
const benchById = new Map(benchmarks.map((b) => [b.id, b]));
const released = new Map(models.map((m) => [m.id, m.released ?? null]));
const PCT_UNIT = /^\s*(%|f1|anls ?%|anls x100|% win|accuracy|pass@1|percent|)\s*$/i;
const normUnit = (u: string | null | undefined) => {
  if (PCT_UNIT.test(u ?? '')) return '%';
  const s = (u ?? '').toLowerCase();
  if (s.includes('elo')) return 'elo';
  if (s === 'usd' || s === '$') return 'usd';
  if (s === 'index') return 'index';
  return 'score';
};
const EFFORT = /\b(none|minimal|low|medium|high|x-?high|max(?:imum)?)\s+(?:reasoning\s+)?(?:effort|reasoning|thinking)\b|\b(?:effort|reasoning|thinking)(?:\s+level)?[:=]?\s*\(?(none|minimal|low|medium|high|x-?high|max(?:imum)?)\b/i;
const effortOf = (text?: string) => {
  const m = text?.match(EFFORT);
  const w = (m?.[1] ?? m?.[2])?.toLowerCase().replace('-', '').replace('maximum', 'max');
  return w ? `${w} effort` : null;
};
const hostOf = (u: string | null | undefined) => (u ?? '').match(/https?:\/\/([^/\s?#]+)/i)?.[1].toLowerCase().replace(/^www\./, '') ?? '';
const readHosts = new Map(Object.entries<Json>(lb.boards).map(([id, x]) => [id, new Set([hostOf(x.url), hostOf(x.feed)].filter(Boolean))]));
type Via = 'epoch' | 'board' | 'lab' | 'paper' | 'unknown';
const viaOf = (r: any[]): Via => r[7] ?? (benchById.get(r[0])?.epoch?.runs === 'external' ? 'unknown' : 'epoch');

// A Creative Commons license a board's terms name. Code licenses (MIT, Apache) cover software, not the scores,
// so only Creative Commons names count. "Creative Commons NonCommercial 4.0" is CC BY-NC 4.0.
function ccLicense(terms: string): string | null {
  if (/Creative Commons Non-?Commercial 4\.0/i.test(terms)) return 'CC BY-NC 4.0';
  const m = terms.match(/\bCC[- ]BY(?:[- ](?:NC|SA|ND))*(?: \d\.\d)?|\bCC0(?: 1\.0)?/i);
  if (!m) return null;
  const raw = m[0].toUpperCase();
  if (raw.startsWith('CC0')) return 'CC0 1.0';
  const mods = [...raw.matchAll(/\b(NC|SA|ND)\b/g)].map((x) => x[1]);
  const version = raw.match(/\d\.\d/)?.[0];
  return `CC BY${mods.length ? `-${mods.join('-')}` : ''}${version ? ` ${version}` : ''}`;
}
const isNonCommercial = (terms: string) => /\bBY[- ]NC\b|CC[- ]BY[- ]NC|Creative Commons Non-?Commercial/i.test(terms);

// ---- build ----------------------------------------------------------------------------------------------
mkdirSync(OUT_DIR, { recursive: true });
const tmp = `${OUT}.tmp`;
rmSync(tmp, { force: true });
const db = new DatabaseSync(tmp);
for (const t of TABLES) {
  const cols = t.cols.map((c) => `${c.name} ${c.type}${c.key && t.cols.filter((x) => x.key).length === 1 ? ' PRIMARY KEY' : ''}`);
  db.exec(`create table ${t.name} (${cols.join(', ')})`);
}
const insert = (table: string) => {
  const t = TABLES.find((x) => x.name === table)!;
  const st = db.prepare(`insert into ${table} (${t.cols.map((c) => c.name).join(', ')}) values (${t.cols.map(() => '?').join(', ')})`);
  return (row: Record<string, unknown>) => st.run(...t.cols.map((c) => toSql(row[c.name])));
};
const toSql = (v: unknown): string | number | null => {
  if (v === undefined || v === null || v === '') return null;
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (typeof v === 'number' || typeof v === 'string') return v;
  return JSON.stringify(v);
};
const json = (v: unknown) => (v === undefined || v === null || (Array.isArray(v) && !v.length) ? null : JSON.stringify(v));

db.exec('begin');

const putLab = insert('labs');
for (const l of labs) putLab({ ...l, aliases: json(l.aliases) });

const putModel = insert('models');
for (const m of models) putModel({ ...m, card_url: m.card, epoch_name: m.epoch, aliases: json(m.aliases) });

const putBench = insert('benchmarks');
for (const b of benchmarks) {
  const repo = b.links?.repo as string | undefined;
  putBench({
    ...b,
    aliases: json(b.aliases),
    area: areaOf(b.category),
    category_name: CATEGORY_NAME[b.category ?? ''] ?? null,
    unit: b.unit ?? '%',
    better: b.better ?? 'higher',
    repo,
    github: repo?.match(/github\.com\/([^/\s?#]+\/[^/\s?#]+)/i)?.[1].replace(/\.git$/, '') ?? null,
    dataset: b.links?.dataset,
    leaderboard: b.links?.leaderboard,
    paper: b.links?.paper,
    site: b.links?.site,
    epoch_name: b.epoch?.epoch_name,
    refreshes: json(b.refreshes),
    changes: json(b.changes),
  });
}

const putBoard = insert('boards');
const boardInfo = new Map<string, { license: string | null; nc: boolean }>();
for (const [id, x] of Object.entries<Json>(lb.boards)) {
  const info = { license: ccLicense(x.terms ?? ''), nc: isNonCommercial(x.terms ?? '') };
  boardInfo.set(id, info);
  putBoard({
    benchmark: id,
    url: x.url,
    feed: x.feed,
    host: x.host,
    terms: x.terms,
    license: info.license,
    noncommercial: info.nc ? 1 : 0,
    retrieved: x.retrieved,
    rows: x.rows,
    unmatched: x.unmatched?.length ?? 0,
    cost_per: x.costPer,
    chart: json(x.chart),
    parts: json(x.parts),
    last_failed: x.failed?.date,
  });
}

const putScore = insert('scores');
const unitOf = (b: string) => benchById.get(b)?.unit ?? '%';
const counts = { leaderboard: 0, unlisted: 0, epoch: 0, collected: 0, card: 0 };
// leaderboard rows: benchmark, model, setting, harness, score, date, cost, tokens, metrics
for (const r of lb.rows as any[][]) {
  const info = boardInfo.get(r[0]);
  putScore({
    benchmark: r[0], model: r[1], entry_kind: 'model', source: 'leaderboard', independent: 1, claim: 0, site_hidden: 0,
    setting: r[2], harness: r[3], value: r[4], unit: unitOf(r[0]), date: r[5] ?? released.get(r[1]) ?? null,
    cost: r[6] ?? null, tokens: r[7] ?? null, metrics: json(r[8]), license: info?.license, noncommercial: info?.nc ? 1 : 0,
  });
  counts.leaderboard++;
}
for (const r of (lb.others ?? []) as any[][]) {
  const info = boardInfo.get(r[0]);
  putScore({
    benchmark: r[0], entry_name: r[1], entry_kind: 'unlisted', source: 'leaderboard', independent: 1, claim: 0, site_hidden: 0,
    setting: r[2], harness: r[3], value: r[4], unit: unitOf(r[0]), date: r[5] ?? null,
    cost: r[6] ?? null, tokens: r[7] ?? null, metrics: json(r[8]), license: info?.license, noncommercial: info?.nc ? 1 : 0,
  });
  counts.unlisted++;
}
// Epoch AI rows: benchmark, model, setting, harness, score, date, metrics, via, from
for (const r of epoch.rows as any[][]) {
  const via = viaOf(r);
  const own = via === 'epoch';
  const hidden = via === 'board' && readHosts.has(r[0]) && (!hostOf(r[8]) || readHosts.get(r[0])!.has(hostOf(r[8])));
  putScore({
    benchmark: r[0], model: r[1], entry_kind: 'model', source: own ? 'epoch' : 'collected', via: own ? null : via, from_source: own ? null : (r[8] ?? null),
    independent: own || via === 'board' ? 1 : 0, claim: own || via === 'board' ? 0 : 1, site_hidden: hidden ? 1 : 0,
    setting: r[2], harness: r[3], value: r[4], unit: unitOf(r[0]), date: r[5] ?? released.get(r[1]) ?? null,
    metrics: json(r[6]), license: epoch.license, noncommercial: 0,
  });
  counts[own ? 'epoch' : 'collected']++;
}
// lab numbers in the benchmark's own unit, as the site counts them
const putCard = insert('cards');
const putResult = insert('card_results');
for (const [kind, list] of [['launch', launch], ['system-card', docs]] as const) {
  for (const d of list) {
    putCard({ ...d, kind });
    for (const r of d.results as Json[]) {
      putResult({ card: d.id, ...r });
      const b = benchById.get(r.benchmark);
      if (r.score === null || r.score === undefined || !b) continue;
      const u = normUnit(r.unit);
      if (u !== (b.unit ?? '%')) continue;
      if (u === '%' && (r.score < 0 || r.score > 100)) continue;
      putScore({
        benchmark: r.benchmark, model: d.model, entry_kind: 'model', source: 'card', independent: 0, claim: 1, site_hidden: 0,
        setting: effortOf(r.as_written), value: r.score, unit: u, date: d.date, card: d.id, noncommercial: 0,
      });
      counts.card++;
    }
  }
}

const putFacet = insert('facets');
const facetFile = readJson<{ benchmarks: Record<string, Record<string, unknown>> }>(dataPath('facets.json'));
for (const [benchmark, f] of Object.entries(facetFile.benchmarks)) {
  if (!benchById.has(benchmark)) continue;
  for (const [facet, v] of Object.entries(f)) for (const value of Array.isArray(v) ? v : v == null ? [] : [v]) putFacet({ benchmark, facet, value: String(value) });
}

const putEci = insert('eci');
for (const e of epoch.eci as Json[]) putEci(e);

const putAbstract = insert('abstracts');
for (const [id, a] of Object.entries(abstracts)) if (benchById.has(id)) putAbstract({ benchmark: id, ...a });

const putRepo = insert('repos');
for (const [repo, g] of Object.entries(github)) putRepo({ repo, stars: g.stars, license: g.license, pushed: g.pushed, archived: g.archived ? 1 : 0 });

// the day the data stands at: the newest card, Epoch AI read or board read
const asOf = [epoch.retrieved, lb.retrieved, ...launch.map((d) => d.date)].filter(Boolean).sort().at(-1) as string;
const built = new Date().toISOString().slice(0, 10);
const cite = citation(built);
const putAbout = insert('about');
for (const [key, value] of [
  ['name', 'Benchmark Almanac'],
  ['url', `${SITE_URL}/`],
  ['built', built],
  ['data_as_of', asOf],
  ['credit', CREDIT_LINE],
  ['how_to_credit', HOW_TO_CREDIT.join(' ')],
  ['citation', cite.text],
  ['bibtex', cite.bibtex],
  ['license', LICENSE_NOTE],
  ['dates', DATES_NOTE],
]) putAbout({ key, value });

db.exec('commit');

for (const [t, cols] of [
  ['scores', ['benchmark', 'model']],
  ['card_results', ['benchmark', 'card']],
  ['cards', ['model', 'lab']],
  ['models', ['lab']],
  ['benchmarks', ['family', 'category', 'area']],
  ['facets', ['benchmark', 'facet']],
] as const)
  for (const c of cols) db.exec(`create index ${t}_${c} on ${t}(${c})`);
for (const v of VIEWS) db.exec(`create view ${v.name} as ${v.sql}`);
db.exec('analyze');
db.exec('vacuum');

if (process.argv.includes('--check')) {
  for (const ex of EXAMPLES) {
    const t0 = performance.now();
    const rows = db.prepare(ex.sql).all();
    console.log(`  ${ex.id}: ${rows.length} rows, ${(performance.now() - t0).toFixed(0)} ms`);
    if (!rows.length) throw new Error(`build-db: example ${ex.id} returned no rows`);
  }
}
db.close();
renameSync(tmp, OUT);
const raw = readFileSync(OUT);
const gz = gzipSync(raw, { level: 9 });
writeFileSync(`${OUT}.gz`, gz);
const mb = (n: number) => `${(n / 1e6).toFixed(1)} MB`;
console.log(
  `wrote public/data/almanac.db: ${mb(statSync(OUT).size)}, ${mb(gz.length)} gzipped. Scores: ${counts.leaderboard} board, ${counts.unlisted} unlisted, ${counts.epoch} Epoch AI runs, ${counts.collected} collected, ${counts.card} lab numbers.`,
);
