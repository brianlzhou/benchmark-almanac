// Long-Horizon Terminal-Bench (LHTB) 1.0: 46 tasks, one trial each, 90-minute agent budget. The board is
// the IntelligenceLab/LHTB-leaderboard Hugging Face dataset, whose default config is data/leaderboard.jsonl:
// one row per submission with mean_reward (0 to 1, the ranking and the score), solve counts, agent and
// budget. Unranked extended-budget runs ("Claude Opus 5 (2h)") are kept with the budget as the setting.
// LHTB 2.0 is a separate benchmark (long-horizon-terminal-bench-2-0.ts).
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const FEED = 'https://huggingface.co/datasets/IntelligenceLab/LHTB-leaderboard/resolve/main/data/leaderboard.jsonl';

interface Row {
  rank: number | null;
  model: string;
  agent?: string;
  mean_reward?: number;
  agent_budget_sec?: number;
}

const board: Leaderboard = {
  benchmark: 'long-horizon-terminal-bench-lhtb',
  url: 'https://huggingface.co/datasets/IntelligenceLab/LHTB-leaderboard',
  feed: FEED,
  terms: 'Hugging Face dataset IntelligenceLab/LHTB-leaderboard, licensed Apache-2.0.',
  aliases: {
    'GPT-5.6-sol': 'gpt-5-6-sol',
  },
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const line of (await fetchText(FEED)).split('\n')) {
      if (!line.trim()) continue;
      const r = JSON.parse(line) as Row;
      if (typeof r.mean_reward !== 'number') continue;
      // "DeepSeek V4 Flash (3h)": an extended-budget run outside the ranked 90-minute board
      const budget = r.model.match(/\s*\((\d+)h\)$/);
      const model = budget ? r.model.slice(0, budget.index).trim() : r.model.trim();
      const minutes = r.agent_budget_sec ? Math.round(r.agent_budget_sec / 60) : undefined;
      rows.push({
        model,
        score: r.mean_reward * 100,
        harness: r.agent || undefined,
        setting: r.rank == null && minutes && minutes !== 90 ? `${minutes} min budget` : undefined,
      });
    }
    return rows;
  },
};
export default board;
