// image2floorplan-bytedance: whole-benchmark results transcribed on 2026-11-08.
// Image: https://lf3-static.bytednsdoc.com/obj/eden-cn/lapzild-tss/ljhwZthlaukjlkulzlp/user-upload/4xfa4mqq4v1ol.png
// The score is Image2FloorPlan Avg Score.
// Two separate visual passes checked every printed score. The image hash must match before rows are returned.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';
const FEED = "https://lf3-static.bytednsdoc.com/obj/eden-cn/lapzild-tss/ljhwZthlaukjlkulzlp/user-upload/4xfa4mqq4v1ol.png (transcribed 2026-11-08)";
import { checkedImageRows } from '../lib/boards/transcribed-h1.ts';
const IMAGE = "https://lf3-static.bytednsdoc.com/obj/eden-cn/lapzild-tss/ljhwZthlaukjlkulzlp/user-upload/4xfa4mqq4v1ol.png";
const SHA256 = "ce06740fa065985fdd2fc492012437b2114f2e606a43e5135cfbc52aeaba4a2e";
const ROWS: LeaderboardRow[] = [
  {
    "model": "Seed2.1 Pro",
    "score": 48
  },
  {
    "model": "Seed2.1 Turbo",
    "score": 35.9
  },
  {
    "model": "Claude Opus 4.7",
    "score": 50.2
  },
  {
    "model": "GPT-5.5",
    "score": 50.7
  },
  {
    "model": "Gemini 3.1 Pro",
    "score": 55.1
  }
];
const board: Leaderboard = {
  benchmark: "image2floorplan-bytedance",
  url: "https://seed.bytedance.com/en/blog/seed2-1-officially-released-advancing-ai-productivity",
  feed: FEED,
  terms: "The authors publish this source publicly. Robots rules permit this path. Source attribution and licensing apply.",
  async fetch(): Promise<LeaderboardRow[]> {
    return checkedImageRows(IMAGE, SHA256, ROWS);
  },
};
export default board;
