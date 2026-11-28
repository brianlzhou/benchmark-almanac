// InferenceBench measures how much an agent improves LLM serving speed over a PyTorch baseline.
// The headline score is aggregate geometric-mean speedup, with four scenario speedups and uncertainty as metrics.
// Source defines uncertainty as: "Bars show geometric-mean speedup; whiskers show ±SEM over seed-pair runs."
// This importer reads the leaderboardRows array from the public JavaScript feed.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson, fetchText } from '../lib/util.ts';
import { jsLiteral } from '../lib/html.ts';

const PAGE = 'https://inferencebench.ai/';
const FEED = 'https://inferencebench.ai/script.js?v=20261119-2';
const COST_FEED = 'https://inferencebench.ai/data/cost-efficiency.json?v=20261119-1';
const board: Leaderboard = {
  benchmark: 'inferencebench',
  costPer: 'run',
  stats: { prefill: { name: 'Prefill speedup', unit: 'speedup', better: 'higher' }, decode: { name: 'Decode speedup', unit: 'speedup', better: 'higher' }, throughput: { name: 'Throughput speedup', unit: 'speedup', better: 'higher' }, allInOne: { name: 'All-in-one speedup', unit: 'speedup', better: 'higher' } },
  chart: {
    title: 'Speedup vs. 12-run API cost',
    x: { key: 'cost', label: '12-run API cost', unit: '$', better: 'lower', log: true },
    y: { key: 'score', label: 'Aggregate speedup', unit: 'x', better: 'higher' },
    note: 'InferenceBench plots aggregate geometric-mean speedup against total 12-run API cost on a log scale.',
  },
  url: `${PAGE}#leaderboard`,
  feed: FEED,
  terms: 'The public page and JavaScript feed publish the leaderboard. No separate score-reuse license is stated, and the site has no robots.txt.',
  harnesses: 'system',
  async fetch(): Promise<LeaderboardRow[]> {
    const [source, costData] = await Promise.all([
      fetchText(FEED),
      fetchJson<{ configs?: Array<{ key: string; full_12_run_cost_usd?: number; runs?: unknown[] }> }>(COST_FEED),
    ]);
    const costByKey = new Map(
      (costData.configs ?? [])
        .filter((c) => typeof c.full_12_run_cost_usd === 'number' && Number.isFinite(c.full_12_run_cost_usd))
        .map((c) => [c.key, { cost: c.full_12_run_cost_usd!, trials: Array.isArray(c.runs) && c.runs.length ? c.runs.length : undefined }]),
    );
    const marker = source.indexOf('const leaderboardRows =');
    if (marker < 0) throw new Error('InferenceBench leaderboardRows missing');
    const rows = jsLiteral<Array<{ key?: string; model: string; scaffold?: string; value: number; sem?: number; a?: number; b?: number; c?: number; d?: number }>>(source, source.indexOf('[', marker));
    if (rows.length < 50) throw new Error(`InferenceBench: ${rows.length} rows, expected at least 50`);
    return rows.map((row) => {
      const label = row.model.trim();
      const settingMatch = label.match(/^(.*)\s+\(([^()]+)\)$/);
      const model = (settingMatch?.[1] ?? label).trim();
      const scaffold = row.scaffold?.replace(/\s*·\s*/g, ', ');
      const setting = [settingMatch?.[2], scaffold].filter(Boolean).join(', ');
      const metrics: Record<string, number> = {};
      for (const [key, value] of Object.entries({ prefill: row.a, decode: row.b, throughput: row.c, allInOne: row.d, stderr: row.sem })) {
        if (typeof value === 'number' && Number.isFinite(value)) metrics[key] = value;
      }
      const extra = row.key ? costByKey.get(row.key) : undefined;
      return { model, setting: setting || undefined, harness: row.scaffold?.split(' · ')[0], score: row.value, ...(extra?.cost !== undefined ? { cost: extra.cost } : {}), ...(extra?.trials !== undefined ? { trials: extra.trials } : {}), low: row.sem != null ? row.value - row.sem : undefined, high: row.sem != null ? row.value + row.sem : undefined, metrics };
    });
  },
};
export default board;
