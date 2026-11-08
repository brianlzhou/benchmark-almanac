// qodo-code-review-benchmark: whole-benchmark scores transcribed on 2026-11-08.
// Image: https://www.qodo.ai/wp-content/uploads/2026/02/AI-Code-Review-Benchmark-1-1.png
// The current Qodo page publishes whole-benchmark F1 for seven code review systems. Backbone models are unspecified. This source is Qodo, not Fireworks.
// Two separate visual passes agreed. A changed SHA-256 requires a new transcription.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';
const FEED = "https://www.qodo.ai/wp-content/uploads/2026/02/AI-Code-Review-Benchmark-1-1.png (transcribed 2026-11-08)";
import { checkedImageRows } from '../lib/boards/transcribed-h1.ts';
const IMAGE = "https://www.qodo.ai/wp-content/uploads/2026/02/AI-Code-Review-Benchmark-1-1.png";
const SHA256 = "e8e529079d799937bfe257905fac73260ac5b66c641df24a20c54808a1aa5b96";
const ROWS: LeaderboardRow[] = [
  {
    "model": "Qodo (code review system, backbone unspecified)",
    "score": 55.4
  },
  {
    "model": "Augment (code review system, backbone unspecified)",
    "score": 44.1
  },
  {
    "model": "Copilot (code review system, backbone unspecified)",
    "score": 42.8
  },
  {
    "model": "Cursor (code review system, backbone unspecified)",
    "score": 39.3
  },
  {
    "model": "Greptile (code review system, backbone unspecified)",
    "score": 39.0
  },
  {
    "model": "Codex (code review system, backbone unspecified)",
    "score": 37.6
  },
  {
    "model": "CodeRabbit (code review system, backbone unspecified)",
    "score": 28.0
  }
];
const board: Leaderboard = {
  benchmark: "qodo-code-review-benchmark",
  url: "https://www.qodo.ai/ai-code-review-benchmark/",
  feed: FEED,
  terms: "The authors publish this source publicly. Robots rules permit this path. Source attribution and licensing apply.",
  async fetch(): Promise<LeaderboardRow[]> {
    return checkedImageRows(IMAGE, SHA256, ROWS);
  },
};
export default board;
