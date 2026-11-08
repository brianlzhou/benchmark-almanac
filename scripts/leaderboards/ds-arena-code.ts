// ds-arena-code: whole-benchmark results transcribed on 2026-11-08.
// Image: https://cdn.deepseek.com/api-docs/benchmark_3.png
// Only two models have printed DS-Arena-Code win rates. The absent DeepSeek-V2-0628 bar is not a zero.
// Two separate visual passes checked every printed score. The image hash must match before rows are returned.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';
const FEED = "https://cdn.deepseek.com/api-docs/benchmark_3.png (transcribed 2026-11-08)";
import { checkedImageRows } from '../lib/boards/transcribed-h1.ts';
const IMAGE = "https://cdn.deepseek.com/api-docs/benchmark_3.png";
const SHA256 = "770f4f00706e24888db3bd0ca27f5bdbb5d1425466e288f809e3c5975e3f06a9";
const ROWS: LeaderboardRow[] = [
  {
    "model": "DeepSeek-Coder-V2-0724",
    "score": 49.5
  },
  {
    "model": "DeepSeek-V2.5",
    "score": 63.1
  }
];
const board: Leaderboard = {
  benchmark: "ds-arena-code",
  url: "https://api-docs.deepseek.com/news/news0905",
  feed: FEED,
  terms: "The authors publish this source publicly. Robots rules permit this path. Source attribution and licensing apply.",
  async fetch(): Promise<LeaderboardRow[]> {
    return checkedImageRows(IMAGE, SHA256, ROWS);
  },
};
export default board;
