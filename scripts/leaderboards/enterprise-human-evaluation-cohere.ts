// enterprise-human-evaluation-cohere: whole-benchmark scores transcribed on 2026-11-08.
// Image: https://storage.ghost.io/c/81/47/8147eb50-617d-4929-b563-3922b88421fd/content/images/2025/03/Win-Rate_Command-A-vs-GPT4o-Nov-.png
// The Average bar supplies each model's win rate across all enterprise tasks. Ties and losses remain metrics.
// Two separate visual passes agreed. A changed SHA-256 requires a new transcription.
import type { Leaderboard, LeaderboardRow } from './types.ts';
const FEED = "https://storage.ghost.io/c/81/47/8147eb50-617d-4929-b563-3922b88421fd/content/images/2025/03/Win-Rate_Command-A-vs-GPT4o-Nov-.png (transcribed 2026-11-08)";
import { checkedImageRows } from '../lib/boards/transcribed-image.ts';
const IMAGE = "https://storage.ghost.io/c/81/47/8147eb50-617d-4929-b563-3922b88421fd/content/images/2025/03/Win-Rate_Command-A-vs-GPT4o-Nov-.png";
const SHA256 = "b7b3c1d158a3c991fbe508bbea50c9318e1118abe070396aca1a350ecd44bc59";
const ROWS: LeaderboardRow[] = [
  {
    "model": "Command A",
    "score": 51.7,
    "metrics": {
      "tieRate": 15.3,
      "lossRate": 33.0
    }
  },
  {
    "model": "gpt-4o-2024-11-20",
    "score": 33.0,
    "metrics": {
      "tieRate": 15.3,
      "lossRate": 51.7
    }
  }
];
const board: Leaderboard = {
  benchmark: "enterprise-human-evaluation-cohere",
  url: "https://cohere.com/blog/command-a",
  feed: FEED,
  terms: "The authors publish this source publicly. Robots rules permit this path. Source attribution and licensing apply.",
  aliases: { 'Command A': 'cohere-command-a' },
  async fetch(): Promise<LeaderboardRow[]> {
    return checkedImageRows(IMAGE, SHA256, ROWS);
  },
};
export default board;
