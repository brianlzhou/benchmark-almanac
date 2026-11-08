// Vals Index on vals.ai. Each vals.ai benchmark page is server-rendered HTML whose first table is the
// leaderboard: Rank | Model | Accuracy | Cost / Test | (Tokens / Test) | Duration / Test. Accuracy is the
// score and Cost / Test the cost per task. Tokens / Test counts input and output, so only its output part
// (below) is kept. Each model links to /models/<slug>; a slug ending in "-thinking" marks a thinking run
// whose name does not say so, and that becomes the setting. Boards with another headline column ("Task Pass Rate", "All-Pass",
// "Score") or a per-task cost under another name pass those column names to valsRows; a column such as
// "Harness" or "Search Tool" can be kept as the harness. Cost columns that are token prices ("Cost In /
// Out") are kept as priceIn and priceOut in dollars per million tokens. For those columns and Total Cost,
// cost comes only from the matched chart run's cost_per_test. The other Vals importers read their pages
// through valsRows.
//
// The page's scatter chart gets the same runs as an Astro island prop, "benchmarkView" (or, on some pages, as
// /_astro/benchmark_view_<id>.<hash>.json). valsRows reads it as data to add what the table rounds or leaves
// out: output tokens per test (`tokens`, the output part of Tokens / Test, computed as the page does), the
// mean seconds per test (`latency`, the Duration / Test column), the score's 95% confidence interval that
// the page shows (±1.96 standard errors, as `ciLow` and `ciHigh`) and the mean turns per test of agentic
// runs (`turns`). A board can
// also keep another task's score from that data as a metric (`tasks`). The chart can put latency on its x
// axis, which VALS_LATENCY_CHART redraws.
import type { BoardChart, Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson, fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

export const valsPage = (slug: string) => `https://www.vals.ai/benchmarks/${slug}`;
export const VALS_TERMS =
  'Server-rendered page on vals.ai: the site publishes no terms of use, robots.txt allows these pages, and the footer reserves all rights, so scores are cited to Vals AI.';

/** The page's scatter chart with its x axis set to Latency (its other choice, Cost, the site draws itself). */
export const VALS_LATENCY_CHART: BoardChart = {
  title: 'Accuracy against latency',
  note: 'The Vals scatter chart with its x axis switched from Cost to Latency: mean time per test against accuracy, on a log scale.',
  x: { key: 'latency', label: 'Latency (mean per test)', unit: 's', better: 'lower', log: true },
  y: { key: 'score', label: 'Accuracy', unit: '%', better: 'higher' },
};

interface ValsRun {
  accuracy?: number | null;
  latency?: number | null;
  stderr?: number | null;
  cost_per_test?: number | null;
  avg_input_tokens?: number | null;
  avg_output_tokens?: number | null;
  token_totals?: { input_tokens?: number | null; output_tokens?: number | null; reasoning_tokens?: number | null } | null;
  token_tasks_measured?: number | null;
  turn_metrics?: { avg_turns?: number | null } | null;
  harness?: string | null;
}
interface ValsView {
  metadata?: { mode?: string; token_tasks_measured?: number | null; show_latency?: boolean; show_stderr?: boolean };
  tasks?: Record<string, Record<string, ValsRun>>;
}

const ENTITY: Record<string, string> = { quot: '"', amp: '&', lt: '<', gt: '>', '#39': "'", '#x27': "'" };
/** Astro's serialized props: [0, value] for plain values and objects, [1, [...]] for arrays, [0] for undefined. */
function unpack(v: unknown): unknown {
  if (!Array.isArray(v) || typeof v[0] !== 'number' || v.length > 2) return v;
  if (v.length === 1) return undefined;
  const [type, value] = v as [number, unknown];
  if (type === 1 && Array.isArray(value)) return value.map(unpack);
  if (value && typeof value === 'object' && !Array.isArray(value)) return Object.fromEntries(Object.entries(value).map(([k, x]) => [k, unpack(x)]));
  return value;
}

/** The runs behind the page's chart, read as data; null when the page has neither the prop nor the file. */
async function valsView(html: string): Promise<ValsView | null> {
  // each chart on the page gets its own copy; the first holds the overall task, later ones may add others
  let view: ValsView | null = null;
  for (const [, raw] of html.matchAll(/props="(\{&quot;benchmarkView&quot;[^"]*)"/g)) {
    const props = unpack(JSON.parse(`[0,${raw.replace(/&(quot|amp|lt|gt|#39|#x27);/g, (_, e: string) => ENTITY[e])}]`)) as { benchmarkView?: ValsView };
    const v = props.benchmarkView;
    if (!v?.tasks) continue;
    if (!view) view = { metadata: v.metadata, tasks: { ...v.tasks } };
    else for (const [k, runs] of Object.entries(v.tasks)) view.tasks![k] ??= runs;
  }
  if (view?.tasks?.overall) return view;
  const file = html.match(/\/_astro\/benchmark_view_[\w.-]+\.json/)?.[0];
  return file ? fetchJson<ValsView>(`https://www.vals.ai${file}`) : view;
}

export interface ValsColumns {
  /** The headline column, "Accuracy" unless given. */
  score?: string;
  /** A per-task cost column, "Cost / Test" unless given; null for none. */
  cost?: string | null;
  /** A column to keep as the harness, such as "Harness" or "Search Tool". */
  harness?: string;
  /** Other tasks in the page's chart data whose score each row keeps as a metric: metrics key -> task key. */
  tasks?: Record<string, string>;
}

export async function valsRows(slug: string, columns: ValsColumns = {}): Promise<LeaderboardRow[]> {
  const html = await fetchText(valsPage(slug));
  const [t] = tables(html);
  const head = t?.[0]?.map((c) => c.text);
  const col = (name?: string | null) => (name ? (head?.findIndex((h) => h === name) ?? -1) : -1);
  const model = col('Model');
  const accuracy = col(columns.score ?? 'Accuracy');
  const cost = col(columns.cost === undefined ? 'Cost / Test' : columns.cost);
  const harness = col(columns.harness);
  const price = col('Cost In / Out');
  const chartCost = price >= 0 || head?.[cost] === 'Total Cost';
  if (model < 0 || accuracy < 0 || (columns.harness && harness < 0)) throw new Error(`unexpected Vals header on ${slug}: ${head?.join(' | ')}`);
  // the chart's runs, to add tokens, latency, standard error and turns; the table alone still makes the rows
  const view = await valsView(html).catch(() => null);
  const runs = Object.entries(view?.tasks?.overall ?? {});
  const used = new Set<string>();
  const near = (a: number | null | undefined, b: number | undefined) => a != null && b !== undefined && Math.abs(a - b) < 0.006;
  /** The run behind one table row: its model key (vals.ai/models/<provider>_<model> is "<provider>/<model>"),
   * the harness and the rounded score; on a page whose headline is not Accuracy, the only run with that key. */
  const runFor = (href: string, harnessText: string | undefined, score: number, cost: number | undefined) => {
    const base = href.replace('_', '/');
    const free = runs.filter(([k]) => !used.has(k));
    const exact = free.filter(([k, r]) => k === base && (!harnessText || !r.harness || r.harness === harnessText));
    const scored = exact.filter(([, r]) => near(r.accuracy, score));
    let hit = scored.length === 1 ? scored[0] : columns.score && exact.length === 1 ? exact[0] : undefined;
    if (!hit) {
      // keys that differ from the public slug ("alibaba/qwen3.8-max-internal"): the only run with this score and cost
      const same = free.filter(([, r]) => near(r.accuracy, score) && (cost === undefined || near(r.cost_per_test, cost)));
      const named = same.filter(([k]) => k.startsWith(base));
      hit = named.length === 1 ? named[0] : same.length === 1 ? same[0] : undefined;
    }
    if (hit) used.add(hit[0]);
    return hit;
  };
  const showTokens = head?.some((h) => /^Tokens\b/.test(h)) ?? false;
  const md = view?.metadata ?? {};
  const rows: LeaderboardRow[] = [];
  for (const r of t.slice(1)) {
    const cell = r[model];
    const score = num(r[accuracy]?.text);
    if (!cell?.text || score === undefined) continue;
    const href = cell.html.match(/href="\/models\/([^"]+)"/)?.[1] ?? '';
    let name = cell.text.replace(/\(Nonthinking\)/i, '(non-thinking)');
    // "GPT 4o (2024-08-06)": a snapshot date, passed on so the resolver picks that snapshot
    const stamp = name.match(/\s*\((\d{4}-\d\d-\d\d)\)$/);
    if (stamp) name = name.slice(0, stamp.index).trim();
    // "Gemini 3 Pro (11/25)": the month Vals ran the preview, not part of the name
    name = name.replace(/\s*\(\d\d\/\d\d\)$/, '').trim();
    // "Grok 4.1 Fast Non-Reasoning": the mode as a bare suffix
    const off = name.match(/\s+Non-Reasoning$/i);
    if (off) name = name.slice(0, off.index).trim();
    const thinking = /-thinking$/.test(href) && !/think|reason/i.test(name) ? 'thinking' : undefined;
    const setting = off ? 'non-reasoning' : thinking;
    const harnessText = harness >= 0 ? r[harness]?.text || undefined : undefined;
    const costValue = !chartCost && cost >= 0 ? num(r[cost]?.text) : undefined;
    const hit = runs.length ? runFor(href, harnessText, score, costValue) : undefined;
    const [runKey, run] = hit ?? [];
    // output tokens per test as the page computes Tokens / Test: the averages, or the totals over the tasks measured
    const measured = run?.token_tasks_measured ?? md.token_tasks_measured;
    const tokens = !showTokens || !run ? undefined
      : run.avg_input_tokens != null && run.avg_output_tokens != null ? run.avg_output_tokens
      : run.token_totals?.output_tokens != null && measured ? run.token_totals.output_tokens / measured : undefined;
    const metrics: Record<string, number> = {};
    if (price >= 0) {
      const prices = r[price]?.text.match(/^\$([\d.,]+)\s*\/\s*\$([\d.,]+)$/);
      if (prices) {
        metrics.priceIn = Number(prices[1].replace(/,/g, ''));
        metrics.priceOut = Number(prices[2].replace(/,/g, ''));
      }
    }
    // Archived LAB v1 prints run totals, with no measured-task denominator. Keep totals explicitly,
    // never guess tokens per task or substitute the current v1.1 board.
    if (slug === 'hlab-v1' && head?.includes('Input / Output Tokens') && run?.token_totals) {
      const totals = run.token_totals;
      if (totals.input_tokens != null) metrics.inputTokensTotal = totals.input_tokens;
      if (totals.output_tokens != null) metrics.outputTokensTotal = totals.output_tokens;
      if (totals.reasoning_tokens != null) metrics.reasoningTokensTotal = totals.reasoning_tokens;
    }
    if (run?.latency != null && run.latency > 0 && md.show_latency !== false) metrics.latency = run.latency;
    // the page's "95% Confidence Interval", ±1.96 standard errors of the chart's accuracy: kept only when that is the row's score
    if (run?.stderr != null && run.stderr > 0 && md.show_stderr !== false && near(run.accuracy, score)) {
      metrics.ciLow = run.accuracy! - 1.96 * run.stderr;
      metrics.ciHigh = run.accuracy! + 1.96 * run.stderr;
    }
    if (run?.turn_metrics?.avg_turns != null && md.mode === 'agentic') metrics.turns = run.turn_metrics.avg_turns;
    for (const [k, task] of Object.entries(columns.tasks ?? {})) {
      const other = runKey ? view?.tasks?.[task]?.[runKey]?.accuracy : undefined;
      if (other != null) metrics[k] = other;
    }
    rows.push({
      model: name,
      score,
      setting,
      harness: harnessText,
      cost: chartCost ? run?.cost_per_test ?? undefined : costValue,
      date: stamp?.[1],
      ...(tokens ? { tokens } : {}),
      ...(Object.keys(metrics).length ? { metrics } : {}),
    });
  }
  if (!rows.length) throw new Error(`no rows on the Vals ${slug} page`);
  return rows;
}

/** Vals display names the shared resolver cannot place. */
export const VALS_ALIASES: Record<string, string> = {
  Wonder: 'muse-wonder',
  'GPT 4o': 'gpt-4o-aug-2024',
  'Gemini 3 Pro': 'gemini-3-pro',
  'Gemini 3 Flash': 'gemini-3-flash',
  'Gemini 3.1 Pro Preview': 'gemini-3-1-pro',
  'Gemini 3.1 Flash Lite Preview': 'gemini-3-1-flash-lite',
  'Qwen 3.5 Plus': 'qwen-3-5-plus-hosted-397b-a17b',
  'Qwen 3.5 Flash': 'qwen-3-5-flash-hosted-35b-a3b',
  'Qwen 3.8 Max 0902': 'qwen3-8-max-0902',
  'DeepSeek V4': 'deepseek-v4-pro',
  'Command A': 'cohere-command-a',
  // older rows name the snapshot inside the model name; the resolver strips a trailing "(Thinking)" or
  // "(non-thinking)" first and then finds these keys
  'Gemini 2.5 Flash Preview (9/25)': 'gemini-2-5-flash-sep-2025',
  'Gemini 2.5 Flash Lite (9/25)': 'gemini-2-5-flash-lite-sep-2025',
  'Gemini 2.5 Flash Preview 4/17': 'gemini-2-5-flash-apr-2025',
  // the GA model released 2025-06-17, the only non-preview 2.5 Flash before September
  'Gemini 2.5 Flash (7/17)': 'gemini-2-5-flash-jun-2025',
  'Gemini 1.5 Flash (001)': 'gemini-1-5-flash-may-2024',
  'Gemini 1.5 Flash (002)': 'gemini-1-5-flash-sep-2024',
  'Gemini 1.5 Pro (002)': 'gemini-1-5-pro-sept-2024',
  'Gemini 2.0 Flash (001)': 'gemini-2-0-flash-feb-2025',
  'DeepSeek V3 (03/24/2025)': 'deepseek-v3-mar-2025',
  // the July 2025 release; the September update is named Kimi-K2-Instruct-0905
  'Kimi K2 Instruct': 'kimi-k2-jul-2025',
  'Llama 3.1 Instruct Turbo (405B)': 'llama-3-1-405b',
  'Llama 3.1 Instruct Turbo (70B)': 'llama-3-1-70b',
  'Llama 3.1 Instruct Turbo (8B)': 'llama-3-1-8b',
  'Llama 3.2 Vision (11B)': 'llama-3-2-11b',
  'Llama 3.2 Vision (90B)': 'llama-3-2-90b',
  'Llama 3.3 Instruct Turbo (70B)': 'llama-3-3-70b',
  'Magistral Medium 1.2 (09/2025)': 'magistral-medium-1-2',
  'Magistral Small 1.2 (09/2025)': 'magistral-small-1-2',
  // magistral-medium-2506: the June 2025 release, Magistral Medium 1.0
  'mistralai/magistral-medium-2506': 'magistral-medium-1-0',
  'Mistral Large (11/2024)': 'mistral-large-2-nov-2024',
  'Mistral Medium 3.1 (05/2025)': 'mistral-medium-3-1',
  'Mistral Small (02/2024)': 'mistral-small-2402',
  'Mistral Small 3.1 (03/2025)': 'mistral-small-3-1',
  'Qwen 3 (235B)': 'qwen3-235b-a22b',
};

const board: Leaderboard = {
  benchmark: 'vals-index',
  url: valsPage('vals_index'),
  feed: `${valsPage('vals_index')} (server-rendered leaderboard table)`,
  terms: VALS_TERMS,
  aliases: VALS_ALIASES,
  chart: VALS_LATENCY_CHART,
  fetch: () => valsRows('vals_index'),
};
export default board;
