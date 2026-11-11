// doubao-multi-turn-bench-bytedance: whole-benchmark results transcribed on 2026-11-08.
// Image: https://lf3-static.bytednsdoc.com/obj/eden-cn/lapzild-tss/ljhwZthlaukjlkulzlp/user-upload/4xfa4mqq4ujsp.png
// The score is the Doubao Multi-Turn Bench row, not the other benchmarks in the image.
// Two separate visual passes checked every printed score. The image hash must match before rows are returned.
import type { Leaderboard, LeaderboardRow } from './types.ts';
const FEED = "https://lf3-static.bytednsdoc.com/obj/eden-cn/lapzild-tss/ljhwZthlaukjlkulzlp/user-upload/4xfa4mqq4ujsp.png (transcribed 2026-11-08)";
import { checkedImageRows } from '../lib/boards/transcribed-image.ts';
const IMAGE = "https://lf3-static.bytednsdoc.com/obj/eden-cn/lapzild-tss/ljhwZthlaukjlkulzlp/user-upload/4xfa4mqq4ujsp.png";
const SHA256 = "2e310e463e6a3b6ca9b5f79fbc0c5cdfd7bcfe34fec4500dc1a2c7146f6a0e8b";
const ROWS: LeaderboardRow[] = [
  {
    "model": "Seed2.1 Pro",
    "score": 52.5
  },
  {
    "model": "Seed2.1 Turbo",
    "score": 49
  },
  {
    "model": "Claude Opus 4.7",
    "score": 49.8
  },
  {
    "model": "GPT-5.5",
    "score": 62.5
  },
  {
    "model": "Gemini 3.1 Pro",
    "score": 52
  }
];
const board: Leaderboard = {
  benchmark: "doubao-multi-turn-bench-bytedance",
  url: "https://seed.bytedance.com/en/blog/seed2-1-officially-released-advancing-ai-productivity",
  feed: FEED,
  terms: "The authors publish this source publicly. Robots rules permit this path. Source attribution and licensing apply.",
  async fetch(): Promise<LeaderboardRow[]> {
    return checkedImageRows(IMAGE, SHA256, ROWS);
  },
};
export default board;
