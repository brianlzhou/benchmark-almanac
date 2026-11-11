// Agents' Last Exam v1.0: the legacy page still loads /api/demo/leaderboard.
// full/overall is the whole 152-task headline cohort. Other splits stay in metrics.
// Preserve all published API configurations, including historical variants the UI hides.
// Costs and output tokens are totals divided by runs, not by the task-set size.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
const PAGE = 'https://agents-last-exam.org/leaderboard/v1';
const FEED = 'https://agents-last-exam.org/api/demo/leaderboard';
interface Row {
  split: string; model: string; harness: string; harnessVariant?: string | null;
  passRate: number; avgScore?: number; runs: number; tasks: number; splitTasks: number;
  totalDurationS?: number | null; totalInputTokens?: number | null;
  totalOutputTokens?: number | null; totalCostUsd?: number | null;
}
const board: Leaderboard = {
  benchmark: 'agents-last-exam', url: PAGE, feed: `${FEED} (full/overall)`,
  terms: 'The authors publish this JSON for the archived v1.0 page. Code is Apache-2.0 and data CC BY 4.0; the almanac credits and links the source.',
  aliases: { 'anthropic-claude-fable-5': 'claude-fable-5', 'qwen-qwen3-7-max': 'qwen3-7-max' },
  async fetch(): Promise<LeaderboardRow[]> {
    const { rows } = await fetchJson<{ rows: Row[] }>(FEED);
    const key = (r: Row) => `${r.model}|${r.harness}|${r.harnessVariant ?? ''}`;
    const out: LeaderboardRow[] = [];
    for (const r of rows) {
      if (r.split !== 'full/overall' || !Number.isFinite(r.passRate)) continue;
      const metrics: Record<string, number> = { runs: r.runs, tasks: r.tasks, splitTasks: r.splitTasks };
      if (Number.isFinite(r.avgScore)) metrics.partial = r.avgScore! * 100;
      if (r.runs > 0 && typeof r.totalDurationS === 'number') metrics.latency = r.totalDurationS / r.runs;
      if (r.runs > 0 && typeof r.totalInputTokens === 'number') metrics.inputTokens = r.totalInputTokens / r.runs;
      for (const split of rows.filter(s => key(s) === key(r) && s.split !== r.split && s.split !== 'full')) {
        if (Number.isFinite(split.passRate)) metrics[`${split.split}PassRate`] = split.passRate * 100;
      }
      out.push({ model: r.model, score: r.passRate * 100, harness: r.harness,
        setting: r.harnessVariant?.replace(/^(thinking|reasoning)-/, '') || undefined,
        cost: r.runs > 0 && typeof r.totalCostUsd === 'number' ? r.totalCostUsd / r.runs : undefined,
        tokens: r.runs > 0 && typeof r.totalOutputTokens === 'number' ? r.totalOutputTokens / r.runs : undefined, metrics });
    }
    if (!out.length) throw new Error('ALE v1.0 full/overall rows missing');
    return out;
  },
};
export default board;
