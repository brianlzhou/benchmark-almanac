// DS-FIM-Eval: the fill-in-the-middle evaluation row.
// DeepSeek-V2-0628 has no reported score and is excluded.
// Rows were transcribed twice from printed chart labels on 2026-11-08.
// Image: https://cdn.deepseek.com/api-docs/benchmark_4.jpg
// SHA-256: 25219071fc8b06a03ac31a7d6c66f5ba2d5c555a813f52dfcd3652d3dc743d4d
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { chartRows } from '../lib/boards/transcribed-chart.ts';
const FEED = "https://cdn.deepseek.com/api-docs/benchmark_4.jpg (transcribed 2026-11-08)";
const board: Leaderboard = {
 benchmark: "ds-fim-eval",
 url: "https://cdn.deepseek.com/api-docs/benchmark_4.jpg",
 feed: FEED,
 terms: "Public author results read with the Almanac user agent. Attribution and source licensing apply.",

 async fetch(): Promise<LeaderboardRow[]> {
return checked(await chartRows("https://cdn.deepseek.com/api-docs/benchmark_4.jpg", "25219071fc8b06a03ac31a7d6c66f5ba2d5c555a813f52dfcd3652d3dc743d4d", [
  {
    "model": "DeepSeek-Coder-V2-0724",
    "score": 73.2
  },
  {
    "model": "DeepSeek-V2.5",
    "score": 78.3
  }
]));
 },
};
export default board;
