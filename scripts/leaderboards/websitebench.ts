// Test-pooled overall score over the complete 70-site cohort. All tokens, not output-only,
// are stored in metrics. The page embeds richer metadata than its downloadable CSV.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
const URL = 'https://website-bench.com/';
interface Model {id: string; name: string; org?: string; group: string; overall: number; request: number; browser: number; system: number; cost: number; tokens: number; turns: number; score_counts: Record<string, {passed: number; total: number}>}
const board: Leaderboard = {
  benchmark: 'websitebench', parts: {
  request: { name: 'Request', group: 'Task type' },
  browser: { name: 'Browser', group: 'Task type' },
  system: { name: 'System', group: 'Task type' },
}, url: URL, feed: URL + ' (leaderboard-data JSON)',
  terms: 'The WebsiteBench repository is Apache-2.0. The maker publishes score downloads and embedded JSON, and robots.txt permits the page. Source: WebsiteBench authors.',
  stats: {
    totalTokens: { name: 'Total tokens', unit: 'tokens' }, turns: { name: 'Turns', unit: 'count' },
    overall_passed: { name: 'Overall passed tasks', unit: 'count' }, overall_total: { name: 'Overall tasks', unit: 'count' },
    request_passed: { name: 'Request passed tasks', unit: 'count' }, request_total: { name: 'Request tasks', unit: 'count' },
    browser_passed: { name: 'Browser passed tasks', unit: 'count' }, browser_total: { name: 'Browser tasks', unit: 'count' },
    system_passed: { name: 'System passed tasks', unit: 'count' }, system_total: { name: 'System tasks', unit: 'count' },
  },
  chart: {
    title: 'Overall pass rate vs. mean cost per task',
    note: 'Overall test pass rate against mean cost per task, matching the Pareto view on WebsiteBench.',
    x: { key: 'cost', label: 'Mean cost per task', unit: '$', better: 'lower', log: true },
    y: { key: 'score', label: 'Overall pass rate', unit: '%', better: 'higher' },
  },
  async fetch() {
    const html = await fetchText(URL);
    const raw = html.match(/id="leaderboard-data">([\s\S]*?)<\/script>/)?.[1];
    if (!raw) throw new Error('WebsiteBench leaderboard JSON missing');
    const d = JSON.parse(raw) as {schema_version: number; cohort_id: string; total_tasks: number; resources: string; models: Model[]};
    if (d.schema_version !== 2 || !d.resources.includes('per-task means')) throw new Error('WebsiteBench schema changed');
    const waffle = html.match(/id="waffle-data">([\s\S]*?)<\/script>/)?.[1];
    const detail = waffle ? JSON.parse(waffle) as {cohort_id:string; tasks:{id:string; name:string;
      results:Record<string,{status:string; passed:number|null; total:number|null}>}[]} : undefined;
    const siteScores = (model: string) => {
      const metrics: Record<string,number> = {};
      for (const task of detail?.cohort_id === d.cohort_id ? detail.tasks : []) {
        const result = task.results[model];
        if (result?.status !== 'scored' || result.passed == null || !result.total) continue;
        const key = task.id.replace(/-(.)/g, (_, c: string) => c.toUpperCase());
        board.parts![key] = {name:task.name, group:'Website'};
        metrics[key] = 100 * result.passed / result.total;
      }
      return metrics;
    };
    const rows: LeaderboardRow[] = d.models.map(r => ({
      model: r.name, score: r.overall, cost: r.cost, open: r.group === 'open', agentOrg: r.org,
      setting: d.cohort_id, metrics: {request: r.request, browser: r.browser, system: r.system,
        ...siteScores(r.id), totalTokens: r.tokens * 1e6, turns: r.turns,
        ...Object.fromEntries(Object.entries(r.score_counts).flatMap(([k, c]) => [[`${k}_passed`, c.passed], [`${k}_total`, c.total]])),
      },
    }));
    if (rows.length < 3 || rows.some(r => !Number.isFinite(r.score))) throw new Error('WebsiteBench results changed');
    return rows;
  },
};
export default board;
