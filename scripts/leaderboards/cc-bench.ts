// CC-Bench v1.1: whole-set strict win rate against the single reference GLM-4.6.
// The author labels Win, Tie, and Lose from GLM-4.6 perspective. Its printed Lose values are each opponent's wins.
// Every row therefore uses the same reference. GLM-4.6 has no self-comparison score and is excluded.
// Total input plus output tokens per interaction remain secondary metrics, not output tokens per task.
// The author repository README currently links this v1.1 result image.
// Rows were transcribed twice from printed chart labels on 2026-11-08.
// Image: https://huggingface.co/datasets/zai-org/CC-Bench-trajectories/resolve/v1.1/assets/winrate_and_token_usage.jpg
// SHA-256: 50f264551901933ae21fa5496a0f5c7516e47a0c78f44f98d748d5c24f8a0175
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { chartRows } from '../lib/boards/transcribed-chart.ts';
const FEED = "https://huggingface.co/datasets/zai-org/CC-Bench-trajectories/resolve/v1.1/assets/winrate_and_token_usage.jpg (transcribed 2026-11-08)";
const board: Leaderboard = {
 benchmark: "cc-bench",
 url: "https://huggingface.co/datasets/zai-org/CC-Bench-trajectories",
 feed: FEED,
 terms: "Public author results read with the Almanac user agent. Attribution and source licensing apply.",
 aliases: { 'Kimi-K2-0905': 'kimi-k2-sep-2025' },

 async fetch(): Promise<LeaderboardRow[]> {
return checked(await chartRows("https://huggingface.co/datasets/zai-org/CC-Bench-trajectories/resolve/v1.1/assets/winrate_and_token_usage.jpg", "50f264551901933ae21fa5496a0f5c7516e47a0c78f44f98d748d5c24f8a0175", [
  {
    "model": "Claude Sonnet 4",
    "score": 41.9,
    "setting": "reference GLM-4.6",
    "metrics": {
      "lossRate": 48.6,
      "tieRate": 9.5
    }
  },
  {
    "model": "GLM-4.5",
    "score": 36.5,
    "setting": "reference GLM-4.6",
    "metrics": {
      "lossRate": 50,
      "tieRate": 13.5,
      "totalTokensPerRound": 762817
    }
  },
  {
    "model": "Kimi-K2-0905",
    "score": 14.9,
    "setting": "reference GLM-4.6",
    "metrics": {
      "lossRate": 56.8,
      "tieRate": 28.3,
      "totalTokensPerRound": 821759
    }
  },
  {
    "model": "DeepSeek-V3.1-Terminus",
    "score": 27,
    "setting": "reference GLM-4.6",
    "metrics": {
      "lossRate": 64.9,
      "tieRate": 8.1,
      "totalTokensPerRound": 947454
    }
  }
]));
 },
};
export default board;
