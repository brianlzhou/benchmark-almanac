// Agents' Last Exam v1.0: the legacy page still loads /api/demo/leaderboard.
// full/overall is the whole 152-task headline cohort. Other splits stay in metrics.
// Preserve published configurations, pass counts and the measured usage and coverage of each split.
// Costs and output tokens are totals divided by runs, not by the task-set size.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
const PAGE = 'https://agents-last-exam.org/leaderboard/v1';
const FEED = 'https://agents-last-exam.org/api/demo/leaderboard';
interface Row {
  split: string; model: string; harness: string; harnessVariant?: string | null;
  passes: number; passRate: number; avgScore?: number; runs: number; tasks: number; splitTasks: number;
  totalDurationS?: number | null; totalInputTokens?: number | null;
  totalOutputTokens?: number | null; totalCostUsd?: number | null;
}
const board: Leaderboard = {
  harnesses: 'system',
  benchmark: 'agents-last-exam', measures: { partial: 'score' }, url: PAGE, feed: `${FEED} (full/overall)`,
  parts: {
    'full/full-spectrumPassRate': { name: 'Full spectrum', group: 'Difficulty' },
    'full/last-examPassRate': { name: 'Last exam', group: 'Difficulty' },
    'full/near-termPassRate': { name: 'Near term', group: 'Difficulty' },
    licensedPassRate: { name: 'Licensed', group: 'Split' },
    linux_onlyPassRate: { name: 'Linux only', group: 'Split' },
    unlicensedPassRate: { name: 'Unlicensed', group: 'Split' },
    'unlicensed/full-spectrumPassRate': { name: 'Unlicensed full spectrum', group: 'Split' },
    'unlicensed/last-examPassRate': { name: 'Unlicensed last exam', group: 'Split' },
    'unlicensed/near-termPassRate': { name: 'Unlicensed near term', group: 'Split' },
    'unlicensed/overallPassRate': { name: 'Unlicensed overall', group: 'Split' },
  },
  terms: 'The authors publish this JSON for the archived v1.0 page. Code is Apache-2.0 and data CC BY 4.0; the almanac credits and links the source.',
  stats: {
    runs: { name: 'Runs', unit: 'count' }, tasks: { name: 'Tasks', unit: 'count' }, splitTasks: { name: 'Split tasks', unit: 'count' }, latency: { name: 'Average time per run', unit: 'seconds', better: 'lower' }, inputTokens: { name: 'Input tokens per run', unit: 'tokens' },
  },
  aliases: { 'anthropic-claude-fable-5': 'claude-fable-5', 'qwen-qwen3-7-max': 'qwen3-7-max' },
  async fetch(): Promise<LeaderboardRow[]> {
    const { rows } = await fetchJson<{ rows: Row[] }>(FEED);
    const key = (r: Row) => `${r.model}|${r.harness}|${r.harnessVariant ?? ''}`;
    const out: LeaderboardRow[] = [];
    for (const r of rows) {
      if (r.split !== 'full/overall' || !Number.isFinite(r.passRate)) continue;
      const metrics: Record<string, number> = { passes: r.passes, runs: r.runs, tasks: r.tasks, splitTasks: r.splitTasks };
      if (Number.isFinite(r.avgScore)) metrics.partial = r.avgScore! * 100;
      if (r.runs > 0 && typeof r.totalDurationS === 'number') metrics.latency = r.totalDurationS / r.runs;
      if (r.runs > 0 && typeof r.totalInputTokens === 'number') metrics.inputTokens = r.totalInputTokens / r.runs;
      for (const split of rows.filter(s => key(s) === key(r) && s.split !== r.split && s.split !== 'full')) {
        for (const key of ['passes', 'runs', 'tasks', 'splitTasks', 'totalDurationS', 'totalInputTokens', 'totalOutputTokens', 'totalCostUsd'] as const) {
          const value = split[key];
          if (typeof value === 'number' && Number.isFinite(value)) metrics[split.split + '/' + key] = value;
        }
        if (typeof split.avgScore === 'number') metrics[split.split + '/partial'] = 100 * split.avgScore;
        if (Number.isFinite(split.passRate)) metrics[`${split.split}PassRate`] = split.passRate * 100;
      }
      out.push({ model: r.model, score: r.passRate * 100, trials: r.runs, harness: r.harness,
        setting: r.harnessVariant?.replace(/^(thinking|reasoning)-/, '') || undefined,
        cost: r.runs > 0 && typeof r.totalCostUsd === 'number' ? r.totalCostUsd / r.runs : undefined,
        tokens: r.runs > 0 && typeof r.totalOutputTokens === 'number' ? r.totalOutputTokens / r.runs : undefined, metrics });
    }
    if (!out.length) throw new Error('ALE v1.0 full/overall rows missing');
    return out;
  },
};
export default board;
