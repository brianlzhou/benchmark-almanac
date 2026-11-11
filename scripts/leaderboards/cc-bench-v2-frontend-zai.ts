// CC-Bench-V2 Frontend: end-to-end correctness is the headline.
// Build success remains a metric. GLM-4.7 has no printed absolute score and is excluded.
// Rows were transcribed twice from printed chart labels on 2026-11-08.
// Image: https://raw.githubusercontent.com/zai-org/GLM-5/main/resources/realworld_bench.png
// SHA-256: d0f4acc8b06da1c1ba8c21acd256bc06eb9618e2c4c58041f2bb12fd70198b95
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { chartRows } from '../lib/boards/transcribed-chart.ts';
const FEED = "https://raw.githubusercontent.com/zai-org/GLM-5/main/resources/realworld_bench.png (transcribed 2026-11-08)";
const board: Leaderboard = {
 benchmark: "cc-bench-v2-frontend-zai",
 url: "https://raw.githubusercontent.com/zai-org/GLM-5/main/resources/realworld_bench.png",
 feed: FEED,
 terms: "Public author results read with the Almanac user agent. Attribution and source licensing apply.",

 async fetch(): Promise<LeaderboardRow[]> {
return checked(await chartRows("https://raw.githubusercontent.com/zai-org/GLM-5/main/resources/realworld_bench.png", "d0f4acc8b06da1c1ba8c21acd256bc06eb9618e2c4c58041f2bb12fd70198b95", [
  {
    "model": "GLM-5",
    "score": 74.8,
    "metrics": {
      "buildSuccess": 98.0
    }
  },
  {
    "model": "Claude Opus 4.5",
    "score": 75.7,
    "metrics": {
      "buildSuccess": 93.0
    }
  }
]));
 },
};
export default board;
