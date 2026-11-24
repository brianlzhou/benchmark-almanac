// Keep the task scores and run statistics published in Vals AI's chart data alongside its table rows.
import { valsPage, valsRows, type ValsColumns } from '../../leaderboards/vals-index.ts';
import type { Leaderboard } from '../../leaderboards/types.ts';
import { fetchText, fetchJson } from '../util.ts';
import { tables, text, num } from '../html.ts';

interface Run {
  accuracy?: number;
  stderr?: number;
  harness?: string;
  avg_input_tokens?: number;
  avg_output_tokens?: number;
  token_tasks_measured?: number;
  token_totals?: Record<string, number>;
  turn_metrics?: Record<string, number>;
}
interface View {
  tasks?: Record<string, Record<string, Run>>;
  metadata?: { tasks?: Record<string, string> };
}

function unpack(value: unknown): unknown {
  if (!Array.isArray(value)) return value;
  const [type, body] = value;
  if (type === 1 && Array.isArray(body)) return body.map(unpack);
  if (body && typeof body === 'object') return Object.fromEntries(Object.entries(body).map(([key, item]) => [key, unpack(item)]));
  return body;
}

export const VALS_DETAILS_STATS: NonNullable<Leaderboard['stats']> = {
  avg_input_tokens: { name: 'Input tokens per test', unit: 'tokens', better: 'lower' },
  avg_output_tokens: { name: 'Output tokens per test', unit: 'tokens', better: 'lower' },
  avg_reasoning_tokens: { name: 'Reasoning tokens per test', unit: 'tokens', better: 'lower' },
  avg_cache_read_tokens: { name: 'Cache read tokens per test', unit: 'tokens' },
  avg_cache_write_tokens: { name: 'Cache write tokens per test', unit: 'tokens', better: 'lower' },
  token_tasks_measured: { name: 'Tasks with token counts', unit: 'count' },
  'token_totals:input_tokens': { name: 'Total input tokens', unit: 'tokens', better: 'lower' },
  'token_totals:output_tokens': { name: 'Total output tokens', unit: 'tokens', better: 'lower' },
  'token_totals:reasoning_tokens': { name: 'Total reasoning tokens', unit: 'tokens', better: 'lower' },
  'token_totals:cache_read_tokens': { name: 'Total cache read tokens', unit: 'tokens' },
  'token_totals:cache_write_tokens': { name: 'Total cache write tokens', unit: 'tokens', better: 'lower' },
  'turn_metrics:tasks_measured': { name: 'Tasks with turn counts', unit: 'count' },
  'turn_metrics:avg_turns': { name: 'Mean turns per test', unit: 'count', better: 'lower' },
  'turn_metrics:avg_query_seconds': { name: 'Mean query latency', unit: 'seconds', better: 'lower' },
  'turn_metrics:median_query_seconds': { name: 'Median query latency', unit: 'seconds', better: 'lower' },
  'turn_metrics:avg_ttft_seconds': { name: 'Mean time to first token', unit: 'seconds', better: 'lower' },
};

export async function valsDetails(board: Leaderboard, slug: string, columns: ValsColumns = {}) {
  const rows = await valsRows(slug, columns);
  for (const row of rows) {
    row.low = row.metrics?.ciLow;
    row.high = row.metrics?.ciHigh;
  }
  await new Promise(resolve => setTimeout(resolve, 1050));
  const html = await fetchText(valsPage(slug));
  const all: Record<string, Record<string, Run>> = {};
  const labels: Record<string, string> = {};
  function include(view?: View) {
    Object.assign(labels, view?.metadata?.tasks);
    for (const [key, runs] of Object.entries(view?.tasks ?? {})) Object.assign(all[key] ??= {}, runs);
  }
  for (const match of html.matchAll(/props="(\{&quot;benchmarkView&quot;[^"]*)"/g)) {
    const props = JSON.parse(text(match[1]));
    include(unpack(props.benchmarkView) as View);
  }
  const file = html.match(/\/_astro\/benchmark_view_[\w.-]+\.json/)?.[0];
  if (!all.overall && file) include(await fetchJson<View>('https://www.vals.ai' + file));
  const table = tables(html)[0] ?? [];
  const modelColumn = table[0]?.findIndex(cell => cell.text === 'Model');
  const scoreColumn = table[0]?.findIndex(cell => cell.text === (columns.score ?? 'Accuracy'));
  if (modelColumn == null || scoreColumn == null || table.length !== rows.length + 1) return rows;
  for (const [index, row] of rows.entries()) {
    const cells = table[index + 1];
    const href = cells[modelColumn]?.html.match(/href="(\/models\/[^"#]+)"/)?.[1];
    if (!href || num(cells[scoreColumn]?.text) !== row.score) continue;
    row.link = new URL(href, valsPage(slug)).href;
    const base = href.slice('/models/'.length).replace('_', '/');
    const candidates = Object.entries(all.overall ?? {}).filter(([key, run]) =>
      (key === base || key.startsWith(base + ':') || key.startsWith(base + '/')) &&
      (!row.harness || !run.harness || run.harness === row.harness) &&
      (columns.score || (run.accuracy != null && Math.abs(run.accuracy - row.score) < 0.006)));
    if (candidates.length !== 1) continue;
    const [key, run] = candidates[0];
    const metrics = row.metrics ??= {};
    if (row.tokens === undefined && typeof run.avg_output_tokens === 'number' && run.avg_output_tokens > 0) row.tokens = run.avg_output_tokens;
    for (const [field, value] of Object.entries(run)) {
      if (typeof value === 'number' && Number.isFinite(value) && !['accuracy', 'latency', 'cost_per_test', 'temperature', 'top_p', 'max_output_tokens'].includes(field)) metrics[field] = value;
    }
    for (const group of ['turn_metrics', 'token_totals'] as const) {
      for (const [field, value] of Object.entries(run[group] ?? {})) {
        if (typeof value === 'number' && Number.isFinite(value)) metrics[group + ':' + field] = value;
      }
    }
    for (const [task, results] of Object.entries(all)) {
      if (task === 'overall') continue;
      const value = results[key]?.accuracy;
      if (typeof value !== 'number' || !Number.isFinite(value)) continue;
      const existing = Object.entries(columns.tasks ?? {}).find(([, name]) => name === task)?.[0];
      const metric = existing ?? task;
      metrics[metric] = value;
      if (!columns.score && !existing) (board.parts ??= {})[metric] = { name: labels[task] ?? task, group: 'Task' };
    }
  }
  return rows;
}
