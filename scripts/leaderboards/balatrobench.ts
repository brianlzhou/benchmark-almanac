// BalatroBench (Coder's BalatroBot and BalatroLLM). balatrobench.com reads its data from a CDN: a manifest of
// benchmark versions (benchmarks/models/manifest.json) and, for the version marked latest, the default
// strategy's leaderboard.json. Each entry has the model (vendor and name), the run counts, avg_round (the
// average final round reached, the page's ranking column "Round") and run statistics. avg_round is the score
// and the cost per run is the total cost divided by the number of runs. Output tokens per run are likewise
// tokens_out_total over the runs (the table shows them per tool call), and the table's average time per tool
// call stays separate from mean game latency. Standard deviations retain their published denominators.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const PAGE = 'https://balatrobench.com/';
const CDN = 'https://balatrobench-prod.b-cdn.net/benchmarks/models';

interface Entry {
  run_count?: number;
  avg_round?: number;
  run_wins?: number;
  run_completed?: number;
  std_round?: number;
  stats?: Record<string, number>;
  model: { vendor?: string; name: string };
}

const board: Leaderboard = {
  benchmark: 'balatrobench',
  url: PAGE,
  feed: `${CDN}/<latest version>/default/leaderboard.json (avg_round)`,
  terms: 'JSON files on the CDN the balatrobench.com page reads; balatrobench.com robots.txt allows all and the site states no terms; the coder/balatrobench repository is MIT-licensed.',
  async fetch(): Promise<LeaderboardRow[]> {
    const manifest = await fetchJson<{ versions: { version: string; latest?: boolean }[] }>(`${CDN}/manifest.json`);
    const version = manifest.versions.find((v) => v.latest)?.version ?? manifest.versions.at(-1)?.version;
    if (!version) throw new Error('no BalatroBench version in the manifest');
    const data = await fetchJson<{ entries: Entry[] }>(`${CDN}/${version}/default/leaderboard.json`);
    const rows: LeaderboardRow[] = [];
    for (const e of data.entries) {
      if (!e.model?.name || typeof e.avg_round !== 'number') continue;
      const runs = e.run_count ?? 0;
      const metrics: Record<string, number> = {};
      const stats = e.stats ?? {};
      const perRun = (key: string) => runs > 0 && Number.isFinite(stats[key]) ? stats[key] / runs : undefined;
      const averages = {inputTokens: 'tokens_in_total', toolCalls: 'calls_total', successfulCalls: 'calls_success',
        errorCalls: 'calls_error', failedCalls: 'calls_failed'};
      for (const [key, column] of Object.entries(averages)) {
        const value = perRun(column);
        if (value !== undefined) metrics[key] = value;
      }
      const latencyMs = perRun('time_total_ms');
      if (latencyMs !== undefined) metrics.latency = latencyMs / 1000;
      for (const [key, value] of Object.entries({
        std: e.std_round, wins: e.run_wins, completed: e.run_completed,
        inputTokensPerCall: stats.tokens_in_avg, outputTokensPerCall: stats.tokens_out_avg,
        inputTokensPerCallStd: stats.tokens_in_std, outputTokensPerCallStd: stats.tokens_out_std,
        costPerCall: stats.cost_avg, costPerCallStd: stats.cost_std,
        secondsPerCall: stats.time_avg_ms / 1000, secondsPerCallStd: stats.time_std_ms / 1000,
      })) {
        if (typeof value === 'number' && Number.isFinite(value)) metrics[key] = value;
      }
      rows.push({model: e.model.name, score: Math.round(e.avg_round * 100) / 100,
        cost: perRun('cost_total'), tokens: perRun('tokens_out_total'), trials: runs || undefined, metrics});
    }
    return rows;
  },
};
export default board;
