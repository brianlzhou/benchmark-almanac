// CompileBench (Quesma) on compilebench.com, the board Quesma's benchmark index links to. The page is static
// HTML whose ranking is drawn by an inline script from a literal array, `const data = [...]`: per model the
// display name (with its reasoning budget, "claude-opus-4.1-thinking-16k"), the OpenRouter slug, tasks
// passed within three attempts (tasks_passed_rate, the page's default sort, "pass@3") and attempts passed
// (pass@1). The default sort, tasks_passed_rate (a fraction, shown here as 0 to 100), is the score. The
// array is read as JSON, never run. A "-thinking-16k" suffix becomes the setting (thinking with that
// budget), and other effort suffixes ("gpt-5-high") are left for the resolver.
// The page's two Pareto charts read their own inline data (`const dataJson = "..."`, also read as JSON): the
// "CompileBench Cost" chart's total_cost, the US dollars of one pass over all tasks, is kept as `cost`
// (costPer 'run'), and the "CompileBench Speed" chart's total_time, its seconds, as metrics.time. Attempts
// passed (attempts_passed_rate, pass@1) is kept as metrics.pass1 (0 to 100).
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAt } from '../lib/html.ts';

const URL = 'https://www.compilebench.com/';
const MARK = 'const data = [{"model":';

interface Entry {
  model?: string;
  tasks_passed_rate?: number;
  attempts_passed_rate?: number;
}

/** model_name -> the x value of one of the page's scatter charts (chart-cost or chart-time). */
function chartData(html: string, chartId: string, field: string): Map<string, number> {
  const at = html.indexOf(`const chartId = "${chartId}"`);
  const raw = at < 0 ? undefined : html.slice(at).match(/const dataJson = "((?:[^"\\]|\\.)*)"/)?.[1];
  if (!raw) return new Map();
  const points = JSON.parse(JSON.parse(`"${raw}"`)) as Record<string, unknown>[];
  return new Map(points.filter((p) => typeof p.model_name === 'string' && typeof p[field] === 'number').map((p) => [p.model_name as string, p[field] as number]));
}

const board: Leaderboard = {
  benchmark: 'compilebench',
  url: URL,
  feed: `${URL} (inline ranking data, tasks_passed_rate)`,
  terms: 'Static public page; the site has no robots.txt restrictions and no terms, and the CompileBench repository is public.',
  aliases: {
    'kimi-k2-0905': 'kimi-k2-sep-2025',
  },
  costPer: 'run',
  chart: {
    title: 'CompileBench Speed',
    note: 'Share of tasks passed within three attempts against the total time across tasks, with the Pareto frontier.',
    x: { key: 'time', label: 'Total time across tasks', unit: 's', better: 'lower', log: true },
    y: { key: 'score', label: 'Tasks passed (pass@3)', unit: '%', better: 'higher' },
  },
  async fetch() {
    const html = await fetchText(URL);
    const at = html.indexOf(MARK);
    if (at < 0) throw new Error('CompileBench ranking data not found');
    const costs = chartData(html, 'chart-cost', 'total_cost');
    const times = chartData(html, 'chart-time', 'total_time');
    const rows: LeaderboardRow[] = [];
    for (const e of jsonAt<Entry[]>(html, at + MARK.indexOf('['))) {
      if (!e.model || typeof e.tasks_passed_rate !== 'number') continue;
      const budget = e.model.match(/-thinking-(\d+k)$/);
      rows.push({
        model: budget ? e.model.slice(0, budget.index) : e.model,
        score: e.tasks_passed_rate * 100,
        setting: budget ? `thinking ${budget[1]}` : undefined,
        cost: costs.get(e.model),
        metrics: {
          ...(times.has(e.model) ? { time: times.get(e.model)! } : {}),
          ...(typeof e.attempts_passed_rate === 'number' ? { pass1: e.attempts_passed_rate * 100 } : {}),
        },
      });
    }
    if (!rows.length) throw new Error('no rows in the CompileBench ranking data');
    return rows;
  },
};
export default board;
