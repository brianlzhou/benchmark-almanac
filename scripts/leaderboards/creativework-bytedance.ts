// CreativeWork: the whole-benchmark row from the Seed2.1 author release.
// Unrelated benchmarks in this image are excluded.
// Rows were transcribed twice from printed chart labels on 2026-11-08.
// Image: https://lf3-static.bytednsdoc.com/obj/eden-cn/lapzild-tss/ljhwZthlaukjlkulzlp/user-upload/4xfa4mqq4w8x3.png
// SHA-256: 86015958ddceb9573254a4e4754e86d9dabd8f07eca2e99428458877a7e9bff2
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, text } from '../lib/html.ts';
import { paperTables as tables, grid, checked, uncertain } from '../lib/boards/arxiv-h2.ts';
import { chartRows } from '../lib/boards/verified-chart-h2.ts';
const FEED = "https://lf3-static.bytednsdoc.com/obj/eden-cn/lapzild-tss/ljhwZthlaukjlkulzlp/user-upload/4xfa4mqq4w8x3.png (transcribed 2026-11-08)";
const board: Leaderboard = {
 benchmark: "creativework-bytedance",
 url: "https://lf3-static.bytednsdoc.com/obj/eden-cn/lapzild-tss/ljhwZthlaukjlkulzlp/user-upload/4xfa4mqq4w8x3.png",
 feed: FEED,
 terms: "Public author results read with the Almanac user agent. Attribution and source licensing apply.",

 async fetch(): Promise<LeaderboardRow[]> {
return checked(await chartRows("https://lf3-static.bytednsdoc.com/obj/eden-cn/lapzild-tss/ljhwZthlaukjlkulzlp/user-upload/4xfa4mqq4w8x3.png", "86015958ddceb9573254a4e4754e86d9dabd8f07eca2e99428458877a7e9bff2", [
  {
    "model": "Seed2.1 Pro",
    "score": 42.5
  },
  {
    "model": "Seed2.1 Turbo",
    "score": 34.5
  },
  {
    "model": "Claude Opus 4.7",
    "score": 28.3
  },
  {
    "model": "GPT-5.5",
    "score": 30.5
  },
  {
    "model": "Gemini 3.1 Pro",
    "score": 27.4
  }
]));
 },
};
export default board;
