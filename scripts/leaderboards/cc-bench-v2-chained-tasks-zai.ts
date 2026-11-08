// CC-Bench-V2 Chained Tasks: the multi-step chained tasks score.
// GLM-4.7 has only a printed delta and is excluded. No value is estimated or derived.
// Rows were transcribed twice from printed chart labels on 2026-11-08.
// Image: https://raw.githubusercontent.com/zai-org/GLM-5/main/resources/realworld_bench.png
// SHA-256: d0f4acc8b06da1c1ba8c21acd256bc06eb9618e2c4c58041f2bb12fd70198b95
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, text } from '../lib/html.ts';
import { paperTables as tables, grid, checked, uncertain } from '../lib/boards/arxiv-h2.ts';
import { chartRows } from '../lib/boards/verified-chart-h2.ts';
const FEED = "https://raw.githubusercontent.com/zai-org/GLM-5/main/resources/realworld_bench.png (transcribed 2026-11-08)";
const board: Leaderboard = {
 benchmark: "cc-bench-v2-chained-tasks-zai",
 url: "https://raw.githubusercontent.com/zai-org/GLM-5/main/resources/realworld_bench.png",
 feed: FEED,
 terms: "Public author results read with the Almanac user agent. Attribution and source licensing apply.",

 async fetch(): Promise<LeaderboardRow[]> {
return checked(await chartRows("https://raw.githubusercontent.com/zai-org/GLM-5/main/resources/realworld_bench.png", "d0f4acc8b06da1c1ba8c21acd256bc06eb9618e2c4c58041f2bb12fd70198b95", [
  {
    "model": "GLM-5",
    "score": 52.3
  },
  {
    "model": "Claude Opus 4.5",
    "score": 61.6
  }
]));
 },
};
export default board;
