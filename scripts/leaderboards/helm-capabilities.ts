// HELM Capabilities (Stanford CRFM). Every HELM leaderboard at crfm.stanford.edu/helm/<project>/ is built from
// files in the public crfm-helm-public bucket, as air-bench-2024.ts describes. helmRows lists the project's
// releases (or, for older projects, run suites) through the bucket's JSON API, takes the newest, and reads one
// table from one group file. Each row is named by the model id in its HELM run spec, without the org prefix
// ("openai_gpt-4o-2024-05-13" becomes "gpt-4o-2024-05-13"), because display names are loose. A date stamp
// in the id becomes the row date. Rows with no run spec fall back to the display name. HELM stores scores
// as fractions, so most boards pass scale 100. The other HELM importers use helmRows and HELM_ALIASES.
// When the group file's "Efficiency" and "General information" tables cover the score column, rows also
// carry `latency` (observed inference time per request, in seconds) and `tokens` (output tokens per
// request). For a "Mean score" column these are the Efficiency table's own Mean score and the mean of the
// scenarios' "# output tokens"; for a "<Scenario> - <metric>" column, that scenario's columns.
//
// This board: core_scenarios.json, table "Accuracy", column "Mean score" (the mean over MMLU-Pro, GPQA,
// IFEval, WildBench and Omni-MATH), times 100.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import airBench from './air-bench-2024.ts';

export const HELM_BUCKET = 'https://storage.googleapis.com/crfm-helm-public';
export const HELM_TERMS = 'Public HELM output bucket that the leaderboard reads; the HELM code is Apache-2.0.';
/** HELM run-spec model ids the shared resolver cannot place (the AIR-Bench importer's list). */
export const HELM_ALIASES: Record<string, string> = {
  ...(airBench.aliases ?? {}),
  'gemma-2-27b-it': 'gemma-2-27b',
  'gemma-2-9b-it': 'gemma-2-9b',
  'llama-3.1-405b-instruct': 'llama-3-1-405b',
  'llama-3.1-70b-instruct': 'llama-3-1-70b',
  'llama-3.1-8b-instruct': 'llama-3-1-8b',
  'llama-3.2-11b-vision-instruct-turbo': 'llama-3-2-11b',
  'llama-3.2-90b-vision-instruct-turbo': 'llama-3-2-90b',
  'llama-3.3-70b-instruct-turbo': 'llama-3-3-70b-instruct',
  'llama-4-maverick-17b-128e-instruct': 'llama-4-maverick',
  // HELM Lite's "Mixtral (8x7B 32K seqlen)" is the base Mixtral-8x7B-v0.1
  'mixtral-8x7b-32kseqlen': 'mixtral-8x7b',
  'qwen1.5-110b-chat': 'qwen1-5-110b',
  'nova-premier-v1:0': 'amazon-nova-premier',
  'nova-pro-v1:0': 'amazon-nova-pro',
  'nova-lite-v1:0': 'amazon-nova-lite',
  'nova-micro-v1:0': 'amazon-nova-micro',
  'mistral-small-2503': 'mistral-small-3-1',
  'mistral-large-2411': 'mistral-large-2-nov-2024',
  'Mistral-Large-Instruct-2411': 'mistral-large-2-nov-2024',
  'c4ai-command-a-03-2025': 'cohere-command-a',
  'command-a-03-2025': 'cohere-command-a',
  'mistral-large-2512': 'mistral-large-3',
  'claude-v1.3': 'claude-1-3',
  'claude-instant-1.2': 'claude-instant',
  'gemini-2.0-flash-lite-001': 'gemini-2-0-flash-lite',
  'gemini-1.0-pro-vision-001': 'gemini-1-0-pro-vision',
  'pixtral-12b-2409': 'pixtral-12b',
  // GPT-4 Turbo with vision, the November 2023 preview
  'gpt-4-vision-preview': 'gpt-4-turbo-nov-2023',
  'gpt-4-1106-vision-preview': 'gpt-4-turbo-nov-2023',
  'llava-1.5-13b-hf': 'llava-v1-5-13b',
  'llava-v1.6-vicuna-13b-hf': 'llava-v1-6-vicuna-13b',
};

// run-spec suffixes that name a setting, peeled off before the date stamp
const SETTINGS: [RegExp, (m: RegExpMatchArray) => string][] = [
  [/-with-guardian$/, () => 'with guardian'],
  [/-safety-block-none$/, () => 'BLOCK_NONE safety'],
  [/-thinking-(\d+k)$/, (m) => `thinking ${m[1]}`],
  [/-thinking-disabled$/, () => 'thinking disabled'],
  [/-(low|medium|high)-reasoning-effort$/, (m) => m[1]],
  [/-hide-reasoning$/, () => 'reasoning hidden'],
];

export interface HelmTable {
  /** Bucket folder, such as "lite" or "safety". */
  project: string;
  /** "releases" for most projects, "runs" for the ones that publish run suites only. */
  kind?: 'releases' | 'runs';
  /** Group file name without .json, such as "core_scenarios". */
  group: string;
  /** Table title inside the group file, or the first table when not given. */
  table?: string;
  /** Header of the score column. */
  column: string;
  /** Multiplier for the stored value, 100 for fractions. */
  scale?: number;
}

const version = (p: string) => (p.match(/v(\d+)\.(\d+)\.(\d+)\/$/)?.slice(1) ?? []).map(Number);

/** The bucket folder of the newest release (or run suite) of a HELM project, ending in a slash. */
export async function helmNewest(project: string, kind: 'releases' | 'runs' = 'releases'): Promise<string> {
  const list = `https://storage.googleapis.com/storage/v1/b/crfm-helm-public/o?prefix=${project}/benchmark_output/${kind}/&delimiter=/`;
  const { prefixes = [] } = await fetchJson<{ prefixes?: string[] }>(list);
  const newest = prefixes
    .filter((p) => version(p).length === 3)
    .sort((a, b) => {
      const [x, y] = [version(a), version(b)];
      return x[0] - y[0] || x[1] - y[1] || x[2] - y[2];
    })
    .at(-1);
  if (!newest) throw new Error(`no ${kind} for ${project} in the HELM bucket`);
  return newest;
}

/** The feed description for a HELM table, for the Leaderboard's feed field. */
export const helmFeed = (t: HelmTable) =>
  `${HELM_BUCKET}/${t.project}/benchmark_output/${t.kind ?? 'releases'}/<newest>/groups/${t.group}.json (${t.table ? `${t.table}: ` : ''}${t.column})`;

interface Cell {
  value?: string | number | null;
  run_spec_names?: string[];
}
interface Table {
  title?: string;
  header: { value: string }[];
  rows: Cell[][];
}

/** Per model (the table's first cell), the latency and output tokens that go with one score column. */
function helmCosts(tables: Table[], column: string): Map<string, { latency?: number; tokens?: number }> {
  const out = new Map<string, { latency?: number; tokens?: number }>();
  const mean = column === 'Mean score';
  const scenario = column.includes(' - ') ? column.split(' - ')[0] : undefined;
  if (!mean && !scenario) return out;
  const pick = (title: string, test: (h: string) => boolean) => {
    const table = tables.find((x) => x.title === title);
    const cols = (table?.header ?? []).map((h, i) => [h.value, i] as const).filter(([h]) => test(h)).map(([, i]) => i);
    return { table, cols };
  };
  const eff = pick('Efficiency', (h) => (mean ? h === 'Mean score' : h === `${scenario} - Observed inference time (s)`));
  const gen = pick('General information', (h) => (mean ? h.endsWith(' - # output tokens') : h === `${scenario} - # output tokens`));
  const add = (t: { table?: Table; cols: number[] }, key: 'latency' | 'tokens') => {
    for (const r of t.table?.rows ?? []) {
      const name = String(r[0]?.value ?? '').trim();
      const vals = t.cols.map((i) => r[i]?.value);
      // a mean only over scenarios that all have a value
      if (!name || !vals.length || !vals.every((v) => typeof v === 'number' && Number.isFinite(v))) continue;
      const v = (vals as number[]).reduce((a, b) => a + b, 0) / vals.length;
      if (v > 0) out.set(name, { ...out.get(name), [key]: v });
    }
  };
  add(eff, 'latency');
  add(gen, 'tokens');
  return out;
}

export async function helmRows(t: HelmTable): Promise<LeaderboardRow[]> {
  const newest = await helmNewest(t.project, t.kind);
  const tables = await fetchJson<Table[]>(`${HELM_BUCKET}/${newest}groups/${t.group}.json`);
  const table = t.table ? tables.find((x) => x.title === t.table) : tables[0];
  const col = table?.header.findIndex((h) => h.value === t.column) ?? -1;
  if (!table || col < 0) throw new Error(`no "${t.column}" column in ${t.project} ${t.group}.json`);
  const costs = helmCosts(tables, t.column);
  const rows: LeaderboardRow[] = [];
  for (const r of table.rows) {
    const score = r[col]?.value;
    if (typeof score !== 'number' || !Number.isFinite(score)) continue;
    const spec = r.flatMap((c) => c.run_spec_names ?? []).map((s) => s.match(/model=([^,]+)/)?.[1]).find(Boolean);
    let model = spec ? spec.replace(/^[A-Za-z0-9-]+_/, '') : String(r[0]?.value ?? '').trim();
    if (!model) continue;
    const settings: string[] = [];
    for (const [re, name] of SETTINGS) {
      const m = model.match(re);
      if (!m) continue;
      model = model.slice(0, m.index);
      settings.push(name(m));
    }
    const stamp = model.match(/(20\d\d)-?(\d\d)-?(\d\d)$/);
    const c = costs.get(String(r[0]?.value ?? '').trim());
    rows.push({
      model,
      score: score * (t.scale ?? 1),
      setting: settings.join(', ') || undefined,
      date: stamp ? `${stamp[1]}-${stamp[2]}-${stamp[3]}` : undefined,
      ...(c?.tokens ? { tokens: c.tokens } : {}),
      ...(c?.latency ? { metrics: { latency: c.latency } } : {}),
    });
  }
  if (!rows.length) throw new Error(`no scored rows in ${t.project} ${t.group}.json`);
  return rows;
}

const TABLE: HelmTable = { project: 'capabilities', group: 'core_scenarios', table: 'Accuracy', column: 'Mean score', scale: 100 };

const board: Leaderboard = {
  benchmark: 'helm-capabilities',
  url: 'https://crfm.stanford.edu/helm/capabilities/latest/',
  feed: helmFeed(TABLE),
  terms: HELM_TERMS,
  aliases: HELM_ALIASES,
  fetch: () => helmRows(TABLE),
};
export default board;
