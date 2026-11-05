// Long-Horizon Terminal-Bench (LHTB) 1.0: 46 tasks, one trial each, 90-minute agent budget. The board is
// the IntelligenceLab/LHTB-leaderboard Hugging Face dataset, whose default config is data/leaderboard.jsonl:
// one row per submission with mean_reward (0 to 1, the ranking and the score), solve counts, agent and
// budget. Unranked extended-budget runs ("Claude Opus 5 (2h)") are kept with the budget as the setting.
// LHTB 2.0 is a separate benchmark (long-horizon-terminal-bench-2-0.ts). The table's "Solved (≥ 0.95)" and
// "Strict pass (= 1.0)" task counts are kept as percents of n_tasks (`solved95`, `strictPass`).
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const FEED = 'https://huggingface.co/datasets/IntelligenceLab/LHTB-leaderboard/resolve/main/data/leaderboard.jsonl';

interface Row {
  rank: number | null;
  model: string;
  /** "deepseek/deepseek-v4-flash-0731": names the snapshot when the display name does not */
  model_id?: string;
  agent?: string;
  mean_reward?: number;
  agent_budget_sec?: number;
  solved_at_095?: number;
  strict_pass_at_10?: number;
  n_tasks?: number;
}

const board: Leaderboard = {
  benchmark: 'long-horizon-terminal-bench-lhtb',
  url: 'https://huggingface.co/datasets/IntelligenceLab/LHTB-leaderboard',
  feed: FEED,
  terms: 'Hugging Face dataset IntelligenceLab/LHTB-leaderboard, licensed Apache-2.0.',
  aliases: {
    'GPT-5.6-sol': 'gpt-5-6-sol',
    'Doubao Seed 2.1 Pro': 'seed-2-1-pro',
  },
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const line of (await fetchText(FEED)).split('\n')) {
      if (!line.trim()) continue;
      const r = JSON.parse(line) as Row;
      if (typeof r.mean_reward !== 'number') continue;
      // "DeepSeek V4 Flash (3h)": an extended-budget run outside the ranked 90-minute board
      const budget = r.model.match(/\s*\((\d+)h\)$/);
      let model = budget ? r.model.slice(0, budget.index).trim() : r.model.trim();
      // a dated model id ("deepseek-v4-flash-0731") is a snapshot the display name leaves out
      if (r.model_id && /-\d{4}$/.test(r.model_id)) model = r.model_id;
      const minutes = r.agent_budget_sec ? Math.round(r.agent_budget_sec / 60) : undefined;
      const metrics: Record<string, number> = {};
      if (r.n_tasks) {
        if (typeof r.solved_at_095 === 'number') metrics.solved95 = (100 * r.solved_at_095) / r.n_tasks;
        if (typeof r.strict_pass_at_10 === 'number') metrics.strictPass = (100 * r.strict_pass_at_10) / r.n_tasks;
      }
      rows.push({
        model,
        score: r.mean_reward * 100,
        harness: r.agent || undefined,
        setting: r.rank == null && minutes && minutes !== 90 ? `${minutes} min budget` : undefined,
        metrics,
      });
    }
    return rows;
  },
};
export default board;
