// Refreshes data/scores/epoch.json from Epoch AI's benchmark data (CC BY 4.0), and adds any new Epoch
// model or benchmark to the registries so every score points at a known record.
//
// usage: node scripts/sync-epoch.ts [--zip path/to/benchmark_data.zip] [--allow-drop]
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { dataPath, readJson, writeJson, key, slug, parseCsv, today } from './lib/util.ts';
import { epochModelOverride, epochScoreColumn, epochSecondaryMetrics, epochBenchmarkOverride } from './lib/epoch-mapping.ts';
import { provenance, FROM_ARTIFICIAL_ANALYSIS, type Via } from './lib/epoch-provenance.ts';

const ZIP_URL = 'https://epoch.ai/data/benchmark_data.zip';

// Epoch benchmark name -> [csv file, score column] where its metadata leaves them blank
const FILE_GUESS: Record<string, [string, string]> = {
  'SWE-Bench verified': ['swe_bench_verified.csv', 'Best score (across scorers)'],
  'Lech Mazur Writing': ['lech_mazur_writing_external.csv', 'Mean score'],
  HLE: ['hle_external.csv', 'Accuracy'],
  DeepSWE: ['deepswe_external.csv', 'Pass@1'],
  CursorBench: ['cursorbench_external.csv', 'Score'],
  LiveBench: ['live_bench_external.csv', 'Global average'],
  VideoMME: ['video_mme_external.csv', 'Overall (no subtitles)'],
  BoolQ: ['bool_q_external.csv', 'Score'],
  CSQA2: ['common_sense_qa_2_external.csv', 'Score'],
  CritPt: ['critpt_external.csv', 'Accuracy'],
  GBAEval: ['gbaeval_external.csv', 'Overall score'],
  'GDP.pdf': ['gdp_pdf_external.csv', 'GDP.pdf score'],
  SciCode: ['scicode_external.csv', 'Score'],
  'WebDev Arena': ['webdev_arena_external.csv', 'Arena Score'],
  'Blueprint-Bench 2': ['blueprint_bench_2_external.csv', 'Score'],
  MindCube: ['mindcube_external.csv', 'Overall score'],
  'SpatialViz-Bench': ['spatialviz_bench_external.csv', 'Overall score'],
  EnigmaEval: ['enigma_eval_external.csv', 'Accuracy'],
  AlgoTune: ['algotune_external.csv', 'Score'],
  'ALE-Bench': ['ale_bench_external.csv', 'Performance'],
  'Vending-Bench 2': ['vending_bench_2_external.csv', 'Score'],
  'FrontierMath-Erdos': ['frontiermath_erdos.csv', 'Best score (across scorers)'],
  ScienceQA: ['science_qa_external.csv', 'Score'],
  ForecastBench: ['forecastbench_external.csv', 'Overall score'],
  'BTF-3': ['btf3_external.csv', 'Pooled score'],
  'SpireClimb (Slay the Spire 1, Ascension 20 Heart)': ['spireclimb_sts1_a20_heart.csv', 'Best score (across scorers)'],
  'SpireClimb (Slay the Spire 2, Ascension 10)': ['spireclimb_sts2_a10.csv', 'Best score (across scorers)'],
};
const NON_PCT: Record<string, string> = {
  'WebDev Arena': 'elo',
  'METR Time Horizons': 'minutes',
  'Vending-Bench 2': 'usd',
  'ALE-Bench': 'rating',
  'Lech Mazur Writing': 'score',
  ForecastBench: 'brier',
  'BTF-3': 'score',
  AlgoTune: 'speedup',
};
// names for Epoch benchmarks the registry does not have yet
const EPOCH_NAME: Record<string, string> = {
  'GPQA diamond': 'GPQA Diamond',
  'SWE-Bench verified': 'SWE-bench Verified',
  HLE: "Humanity's Last Exam",
  'ARC AI2': 'ARC-Challenge',
  BBH: 'BIG-Bench Hard',
  'Terminal Bench': 'Terminal-Bench 2.0',
  'METR Time Horizons': 'METR Time Horizon',
  'MATH level 5': 'MATH Level 5',
};
const EFFORT = /^(max|xhigh|high|medium|low|minimal|none|thinking|non-thinking|nothinking|\d+[Kk])$/;
const VERSION = /^(.*\S)\s+\(((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec) \d{4})\)$/;

// ---- load the export --------------------------------------------------------------------------------
const zipArg = process.argv.indexOf('--zip');
let zip = zipArg > 0 ? process.argv[zipArg + 1] : '';
if (!zip) {
  const dir = mkdtempSync(join(tmpdir(), 'epoch-'));
  zip = join(dir, 'benchmark_data.zip');
  const res = await fetch(ZIP_URL, { signal: AbortSignal.timeout(180_000) });
  if (!res.ok) throw new Error(`Epoch download failed: ${res.status}`);
  writeFileSync(zip, Buffer.from(await res.arrayBuffer()));
}
const file = (name: string): Record<string, string>[] | null => {
  // the index files sit in a subfolder in newer exports
  for (const path of [name, `epoch_capabilities_index/${name}`]) {
    try {
      const text = execFileSync('unzip', ['-p', zip, path], { maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'ignore'] }).toString();
      if (text.trim()) return parseCsv(text);
    } catch {
      // try the next path
    }
  }
  return null;
};

interface Lab {
  id: string;
  name: string;
  aliases?: string[];
}
interface Model {
  id: string;
  name: string;
  version?: string;
  lab?: string;
  released?: string;
  weights?: string;
  epoch?: string;
  [k: string]: unknown;
}
interface Bench {
  id: string;
  name: string;
  unit?: string;
  better?: string;
  edi?: number;
  epoch?: Record<string, unknown>;
  [k: string]: unknown;
}
const labs = readJson<Lab[]>(dataPath('labs.json'));
const models = readJson<Model[]>(dataPath('models.json'));
const benchmarks = readJson<Bench[]>(dataPath('benchmarks.json'));

const labOf = new Map<string, string>();
for (const l of labs) for (const a of [l.name, ...(l.aliases ?? [])]) labOf.set(a.toLowerCase(), l.id);
function labId(org: string): string | undefined {
  const o = org.split(',')[0].trim();
  if (!o) return undefined;
  const hit = labOf.get(o.toLowerCase());
  if (hit) return hit;
  const id = slug(o);
  labs.push({ id, name: o, aliases: [o] });
  labOf.set(o.toLowerCase(), id);
  console.log(`  new lab: ${o}`);
  return id;
}

// ---- models -----------------------------------------------------------------------------------------
const meta = new Map((file('model_metadata.csv') ?? []).filter((r) => r.model_version).map((r) => [r.model_version, r]));
const byGroup = new Map(models.filter((m) => m.epoch).map((m) => [m.epoch!, m]));
const byKey = new Map(models.map((m) => [key(m.version ? `${m.name} (${m.version})` : m.name), m]));
function modelFor(group: string): Model {
  const hit = byGroup.get(group) ?? byKey.get(key(group));
  if (hit) {
    hit.epoch ??= group;
    return hit;
  }
  const rows = [...meta.values()].filter((r) => r.model_group === group);
  const vm = group.match(VERSION);
  const acc = rows.map((r) => r.accessibility).join(' ');
  const m: Model = {
    id: slug(group),
    name: vm ? vm[1] : group,
    ...(vm ? { version: vm[2].replace('Sept', 'Sep') } : {}),
    lab: labId(rows[0]?.organization ?? ''),
    released: rows.map((r) => r.date).filter(Boolean).sort()[0],
    weights: /open weights/i.test(acc) ? 'open' : acc.trim() ? 'closed' : undefined,
    epoch: group,
  };
  models.push(m);
  byGroup.set(group, m);
  console.log(`  new model: ${group}`);
  return m;
}

// ---- benchmarks -------------------------------------------------------------------------------------
const byEpoch = new Map(benchmarks.filter((b) => b.epoch?.epoch_name).map((b) => [b.epoch!.epoch_name as string, b]));
const benchByKey = new Map(benchmarks.map((b) => [key(b.name), b]));
function benchFor(ename: string, released?: string): Bench {
  const hit = byEpoch.get(ename) ?? benchByKey.get(key(EPOCH_NAME[ename] ?? ename));
  if (hit) return hit;
  const name = EPOCH_NAME[ename] ?? ename;
  const b: Bench = { id: slug(name), name, released: released?.slice(0, 7), unit: '%', confidence: 'likely', epoch: { epoch_name: ename } };
  benchmarks.push(b);
  benchByKey.set(key(name), b);
  console.log(`  new benchmark: ${ename}. Add a description in data/benchmarks.json.`);
  return b;
}

const bmeta = file('benchmark_metadata.csv') ?? [];
// via and from: where Epoch got the score (scripts/lib/epoch-provenance.ts). Appended last, so readers that take
// the first fields by position keep working.
type EpochRow = [string, string, string | null, string | null, number, string | null, Record<string, number> | null, Via, string | null];
const rows: EpochRow[] = [];
// Same fields as rows, but the second field is the unresolved source name. Never create a guessed model.
const others: EpochRow[] = [];
const skipped: Record<string, number> = {};
const skip = (why: string) => (skipped[why] = (skipped[why] ?? 0) + 1);
// per benchmark, how many rows came from each kind of source, printed at the end for a person to check
const viaCount = new Map<string, Partial<Record<Via, number>>>();

for (const m of [...bmeta, ...Object.keys(FILE_GUESS).filter((n) => !bmeta.some((r) => r.benchmark === n)).map((n) => ({ benchmark: n }) as Record<string, string>)]) {
  const ename = m.benchmark;
  let [f, col] = m.source_file && m.score_column ? [m.source_file, m.score_column] : (FILE_GUESS[ename] ?? ['', '']);
  col = epochScoreColumn(ename, col);
  const data = f ? file(f) : null;
  if (!data?.length || !(col in data[0])) {
    skip(`no data: ${ename}`);
    continue;
  }
  const b = benchFor(ename, m.release_date);
  const unit = NON_PCT[ename] ?? '%';
  let scale = Number(m.scale || 1);
  if (unit === '%') {
    const raws = data.map((r) => Number(r[col])).filter((v) => Number.isFinite(v));
    if (raws.length && Math.max(...raws) * scale > 1.5) scale /= 100;
  }
  const tb1 = ename === 'Terminal Bench' ? (benchByKey.get(key('Terminal-Bench')) ?? benchFor('Terminal-Bench')) : undefined;
  for (const r of data) {
    if (FROM_ARTIFICIAL_ANALYSIS.has(f) || r['AA model slug'] || Object.values(r).some((v) => /artificial ?analysis/i.test(v))) {
      skip('Artificial Analysis rows');
      continue;
    }
    const raw = Number(r[col]);
    if (r[col] === '' || !Number.isFinite(raw)) continue;
    const mm = meta.get(r['Model version']);
    if (!mm) {
      skip('unknown model version');
      continue;
    }
    const override = epochModelOverride(ename, r['Model version']);
    const model = override && 'unmatched' in override ? undefined
      : override && 'id' in override ? models.find((m) => m.id === override.id)
      : modelFor(mm.model_group);
    // A missing exact identity stays unlisted. It must never fall back to Epoch's incorrect group.
    const sourceName = override && 'unmatched' in override ? override.unmatched : r['Model version'];
    const pm = (mm.display_name ?? '').match(new RegExp(`^${mm.model_group.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\((.+)\\)$`));
    const tail = r['Model version'].includes('_') ? r['Model version'].split('_').at(-1)! : '';
    const setting = pm?.[1] ?? (EFFORT.test(tail) ? tail : null) ?? (r['Reasoning effort'] || r['Reasoning level'] || r.Reasoning || null);
    const harness = (r.Harness || r.Agent || r.Scaffold || '').trim() || null;
    const value = unit === '%' ? raw * scale * 100 : raw;
    if (unit === '%' && (value < 0 || value > 100.5)) {
      skip('out of range');
      continue;
    }
    // Epoch's Terminal Bench file holds 1.0 runs from before Terminal-Bench 2.0 launched in November 2025
    const targetId = epochBenchmarkOverride(ename, r.Notes ?? '');
    const target = targetId ? benchmarks.find((x) => x.id === targetId)
      : tb1 && (r['Run date'] || r.Created || '9999') < '2025-11-01' ? tb1 : b;
    if (!target) throw new Error(`Epoch row requires missing benchmark ${targetId}; add its reviewed catalog record first`);
    const { via, from } = provenance(f, r);
    const output: EpochRow = [target.id, model?.id ?? sourceName, setting, harness, Math.round(value * 100) / 100,
      (r['Release date'] || mm.date || '').slice(0, 10) || null, epochSecondaryMetrics(ename, r), via, from];
    (model ? rows : others).push(output);
    const vc = viaCount.get(target.id) ?? viaCount.set(target.id, {}).get(target.id)!;
    vc[via] = (vc[via] ?? 0) + 1;
  }
  const rb = Number(m.random_baseline || 0);
  const ceil = Number(m.score_ceiling || 1);
  b.unit = unit;
  b.epoch = {
    epoch_name: ename,
    ...(unit === '%' ? { random: Math.round(rb * 10000) / 100, ceiling: Math.round(ceil * 10000) / 100 } : {}),
    runs: f.endsWith('_external.csv') ? 'external' : 'epoch',
    in_eci: m.in_eci === 'True',
  };
  if (ename === 'ForecastBench' || ename === 'BTF-3') b.better = 'lower';
}

for (const r of file('edi_scores.csv') ?? []) {
  const b = byEpoch.get(r.benchmark_name) ?? benchByKey.get(key(EPOCH_NAME[r.benchmark_name] ?? r.benchmark_name));
  if (b) b.edi = Math.round(Number(r.edi) * 100) / 100;
}
const num = (x: string) => (x === '' ? null : Math.round(Number(x) * 100) / 100);
type Eci = { model: string; eci: number | null; low: number | null; high: number | null };
const eciRows = file('eci_scores.csv');
// keep the last index scores when an export leaves them out
const eci: Eci[] = eciRows
  ? eciRows.map((r) => ({ model: modelFor(r.Model).id, eci: num(r.eci), low: num(r.eci_ci_low), high: num(r.eci_ci_high) }))
  : readJson<{ eci: Eci[] }>(dataPath('scores', 'epoch.json')).eci;

// ---- write ------------------------------------------------------------------------------------------
// a download that unzips to nothing, or a changed export layout, gives few or no rows: never write those over
// the last good data
const lastRows = readJson<{ rows: unknown[] }>(dataPath('scores', 'epoch.json')).rows.length;
if (rows.length < lastRows / 2 && !process.argv.includes('--allow-drop')) {
  console.log(`Only ${rows.length} Epoch scores against ${lastRows} last time. Nothing written; rerun with --allow-drop if that is right.`);
  process.exit(1);
}
rows.sort((a, b) => a[0].localeCompare(b[0]) || (a[5] ?? '').localeCompare(b[5] ?? '') || a[1].localeCompare(b[1]));
const out =
  `{\n  "source": "Epoch AI Benchmarking Hub",\n  "url": "https://epoch.ai/benchmarks",\n  "license": "CC BY 4.0",\n  "retrieved": "${today()}",\n` +
  `  "columns": ["benchmark", "model", "setting", "harness", "score", "date", "metrics", "via", "from"],\n  "rows": [\n` +
  rows.map((r) => `    ${JSON.stringify(r)}`).join(',\n') +
  `\n  ],\n  "otherColumns": ["benchmark", "name", "setting", "harness", "score", "date", "metrics", "via", "from"],\n` +
  `  "others": ${JSON.stringify(others)},\n  "eci": [\n` +
  eci
    .sort((a, b) => (b.eci ?? -1) - (a.eci ?? -1))
    .map((e) => `    ${JSON.stringify(e)}`)
    .join(',\n') +
  `\n  ]\n}\n`;
writeFileSync(dataPath('scores', 'epoch.json'), out);
writeJson(dataPath('models.json'), models.sort((a, b) => (a.released ?? '9999').localeCompare(b.released ?? '9999') || a.id.localeCompare(b.id)));
writeJson(dataPath('benchmarks.json'), benchmarks.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase())));
writeJson(dataPath('labs.json'), labs);
console.log(`Wrote ${rows.length} Epoch scores and ${eci.length} index scores. Skipped: ${JSON.stringify(skipped)}`);
// where each benchmark's rows came from: epoch is Epoch's own run, the rest Epoch collected (see epoch-provenance.ts)
const kinds: Via[] = ['epoch', 'board', 'lab', 'paper', 'unknown'];
const total: Partial<Record<Via, number>> = {};
for (const [id, c] of [...viaCount.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  for (const k of kinds) total[k] = (total[k] ?? 0) + (c[k] ?? 0);
  if (!c.epoch) console.log(`  ${id}: ${kinds.filter((k) => c[k]).map((k) => `${c[k]} ${k}`).join(', ')}`);
}
console.log(`Sources: ${kinds.map((k) => `${total[k] ?? 0} ${k}`).join(', ')}`);
