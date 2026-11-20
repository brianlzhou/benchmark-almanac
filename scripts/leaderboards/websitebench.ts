// Test-pooled overall score over the complete 70-site cohort. All tokens, not output-only,
// are stored in metrics. The page embeds richer metadata than its downloadable CSV.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
const URL = 'https://website-bench.com/';
interface Model {name: string; group: string; overall: number; request: number; browser: number; system: number; cost: number; tokens: number; turns: number; score_counts: Record<string, {passed: number; total: number}>}
const board: Leaderboard = {
  benchmark: 'websitebench', parts: {
  request: { name: 'Request', group: 'Task type' },
  browser: { name: 'Browser', group: 'Task type' },
  system: { name: 'System', group: 'Task type' },
}, url: URL, feed: URL + ' (leaderboard-data JSON)',
  terms: 'The WebsiteBench repository is Apache-2.0. The maker publishes score downloads and embedded JSON, and robots.txt permits the page. Source: WebsiteBench authors.',
  async fetch() {
    const html = await fetchText(URL);
    const raw = html.match(/id="leaderboard-data">([\s\S]*?)<\/script>/)?.[1];
    if (!raw) throw new Error('WebsiteBench leaderboard JSON missing');
    const d = JSON.parse(raw) as {schema_version: number; cohort_id: string; total_tasks: number; resources: string; models: Model[]};
    if (d.schema_version !== 2 || !d.resources.includes('per-task means')) throw new Error('WebsiteBench schema changed');
    const rows: LeaderboardRow[] = d.models.map(r => ({
      model: r.name, score: r.overall, cost: r.cost, open: r.group === 'open',
      setting: d.cohort_id, metrics: {request: r.request, browser: r.browser, system: r.system,
        totalTokensPerTask: r.tokens * 1e6, turnsPerTask: r.turns, tasks: d.total_tasks,
        ...Object.fromEntries(Object.entries(r.score_counts).flatMap(([k, c]) => [[`${k}_passed`, c.passed], [`${k}_total`, c.total]])),
      },
    }));
    if (rows.length < 3 || rows.some(r => !Number.isFinite(r.score))) throw new Error('WebsiteBench results changed');
    return rows;
  },
};
export default board;
