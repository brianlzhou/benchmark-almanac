// rd-tablebench: whole-benchmark scores transcribed on 2026-11-08.
// Image: https://reducto.ai/api/media/file/rd-tablebench.png
// The figure prints the complete table-extraction score for eight systems. Vendor systems retain names without guessed backbones.
// Two separate visual passes agreed. A changed SHA-256 requires a new transcription.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';
const FEED = "https://reducto.ai/api/media/file/rd-tablebench.png (transcribed 2026-11-08)";
import { checkedImageRows } from '../lib/boards/transcribed-h1.ts';
const IMAGE = "https://reducto.ai/api/media/file/rd-tablebench.png";
const SHA256 = "779c672001aca028136a664c9a8429ff4ff3385a1adede1e15df257fbea179c1";
const ROWS: LeaderboardRow[] = [
  {
    "model": "Reducto (document parsing system)",
    "score": 90.2
  },
  {
    "model": "Azure (document parsing system)",
    "score": 82.7
  },
  {
    "model": "Textract (document parsing system)",
    "score": 80.9
  },
  {
    "model": "Claude 3.5 Sonnet (snapshot unspecified)",
    "score": 80.7
  },
  {
    "model": "GPT-4o (snapshot unspecified)",
    "score": 76
  },
  {
    "model": "Llamaparse (document parsing system)",
    "score": 74.6
  },
  {
    "model": "GCloud (document parsing system)",
    "score": 64.6
  },
  {
    "model": "Unstructured (document parsing system)",
    "score": 60.2
  }
];
const board: Leaderboard = {
  benchmark: "rd-tablebench",
  url: "https://reducto.ai/blog/rd-tablebench",
  feed: FEED,
  terms: "The authors publish this source publicly. Robots rules permit this path. Source attribution and licensing apply.",
  async fetch(): Promise<LeaderboardRow[]> {
    return checkedImageRows(IMAGE, SHA256, ROWS);
  },
};
export default board;
