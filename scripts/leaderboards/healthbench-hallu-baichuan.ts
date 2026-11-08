// healthbench-hallu-baichuan: whole-benchmark results transcribed on 2026-11-08.
// Image: https://raw.githubusercontent.com/baichuan-inc/Baichuan-M3-235B/main/images/hb_metrics.png
// The score is the weighted hallucination rate, not the neighboring HealthBench-Hard score. Lower is better.
// Two separate visual passes checked every printed score. The image hash must match before rows are returned.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';
const FEED = "https://raw.githubusercontent.com/baichuan-inc/Baichuan-M3-235B/main/images/hb_metrics.png (transcribed 2026-11-08)";
import { checkedImageRows } from '../lib/boards/transcribed-h1.ts';
const IMAGE = "https://raw.githubusercontent.com/baichuan-inc/Baichuan-M3-235B/main/images/hb_metrics.png";
const SHA256 = "c9a98d8ee64f89730da83c2e4cf241f99bcd453b41472ee37488c317efa39fa4";
const ROWS: LeaderboardRow[] = [
  {
    "model": "Baichuan-M3",
    "score": 3.5
  },
  {
    "model": "GPT-5.2",
    "score": 3.8,
    "setting": "high reasoning effort"
  },
  {
    "model": "medgemma-27b-text-it",
    "score": 5.5
  },
  {
    "model": "DeepSeek-V3.2",
    "score": 6.1,
    "setting": "thinking"
  },
  {
    "model": "Gemini-3-Pro",
    "score": 7.1
  },
  {
    "model": "AntAngelMed",
    "score": 8.2
  },
  {
    "model": "Baichuan-M2",
    "score": 8.4
  },
  {
    "model": "Qwen3-235B-Thinking-2507",
    "score": 11.4
  }
];
const board: Leaderboard = {
  benchmark: "healthbench-hallu-baichuan",
  url: "https://github.com/baichuan-inc/Baichuan-M3-235B",
  feed: FEED,
  terms: "The authors publish this source publicly. Robots rules permit this path. Source attribution and licensing apply.",
  async fetch(): Promise<LeaderboardRow[]> {
    return checkedImageRows(IMAGE, SHA256, ROWS);
  },
};
export default board;
