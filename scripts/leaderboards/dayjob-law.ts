// Surge supplied DAYJOB Law results to Fireworks before the standalone board's release.
// Fireworks labels output and cached token counts as totals, so retain them in metrics, not tokens/task.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
const FEED = 'https://fireworks.ai/specialized-intelligence-index/api/index.json';
type Metric = { value: number | null; unit: string };
type Run = { model: string; metrics: Record<string, Metric>; raw?: { reasoning?: string } };
const board: Leaderboard = {
  benchmark: 'dayjob-law', url: 'https://fireworks.ai/specialized-intelligence-index/benchmarks/legal/dayjob-law', feed: FEED,
  terms: 'Fireworks terms restrict automated extraction; the almanac credits Fireworks AI and benchmark owner Surge AI and links the source.',
  aliases: { 'Muse Wonder 1.0': 'muse-wonder' },
  async fetch(): Promise<LeaderboardRow[]> {
    const data = await fetchJson<{ benchmarks: { id: string; last_updated: string; headline_metric: { unit: string }; results: Run[] }[] }>(FEED);
    const source = data.benchmarks.find(b => b.id === 'legal/dayjob-law');
    if (!source || source.headline_metric.unit !== 'percent') throw new Error('DAYJOB Law board or unit changed');
    const rows = source.results.map(r => {
      const score = r.metrics.score.value;
      if (typeof score !== 'number') throw new Error('DAYJOB Law score missing');
      const metrics = Object.fromEntries(Object.entries(r.metrics).filter(([k,v]) => k !== 'score' && k !== 'cost_per_task' && typeof v.value === 'number').map(([k,v]) => [k,v.value as number]));
      return { model: r.model, score, setting: r.raw?.reasoning, date: source.last_updated,
        cost: r.metrics.cost_per_task?.unit === 'USD' ? r.metrics.cost_per_task.value ?? undefined : undefined, metrics };
    });
    if (!rows.length) throw new Error('DAYJOB Law rows missing');
    return rows;
  },
};
export default board;
