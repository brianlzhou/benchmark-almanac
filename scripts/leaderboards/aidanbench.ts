// aidanbench: whole-benchmark results transcribed on 2026-11-08.
// Image: https://raw.githubusercontent.com/aidanmclaughlin/AidanBench/main/assets/results.png
// The chart prints valid-response totals for its top 25 models. These are the historical chart results.
// The repository JSON contains per-answer records, not the published headline totals. No new aggregation is computed.
// Two separate visual passes checked every printed score. The image hash must match before rows are returned.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';
const FEED = "https://raw.githubusercontent.com/aidanmclaughlin/AidanBench/main/assets/results.png (transcribed 2026-11-08)";
import { checkedImageRows } from '../lib/boards/transcribed-h1.ts';
const IMAGE = "https://raw.githubusercontent.com/aidanmclaughlin/AidanBench/main/assets/results.png";
const SHA256 = "1b0b4c2a133e1e04a204be009b7005b0b9e3ff0c0cc3320562e52f04651cfe54";
const ROWS: LeaderboardRow[] = [
  {
    "model": "o1",
    "score": 3204
  },
  {
    "model": "claude-3.5-sonnet (snapshot unspecified)",
    "score": 2691
  },
  {
    "model": "gemini-2.0-flash-exp",
    "score": 1895
  },
  {
    "model": "o1-preview",
    "score": 1892
  },
  {
    "model": "o1-mini",
    "score": 1577
  },
  {
    "model": "gpt-4-turbo (snapshot unspecified)",
    "score": 1537
  },
  {
    "model": "gemini-2.0-flash-thinking-exp-1219",
    "score": 1531
  },
  {
    "model": "gemini-pro-1.5 (snapshot unspecified)",
    "score": 1515
  },
  {
    "model": "claude-3.5-sonnet-20240620",
    "score": 1439
  },
  {
    "model": "gpt-4o-2024-08-06",
    "score": 1333
  },
  {
    "model": "gpt-4-1106-preview",
    "score": 1331
  },
  {
    "model": "gpt-4o-2024-11-20",
    "score": 1269
  },
  {
    "model": "gpt-4o-2024-05-13",
    "score": 1052
  },
  {
    "model": "gemini-flash-1.5 (snapshot unspecified)",
    "score": 1047
  },
  {
    "model": "gemma-2-27b-it",
    "score": 1028
  },
  {
    "model": "gpt-4-0314",
    "score": 999
  },
  {
    "model": "mistral-large-latest (snapshot unspecified)",
    "score": 953
  },
  {
    "model": "claude-3-opus",
    "score": 908
  },
  {
    "model": "claude-3.5-haiku-20241022",
    "score": 904
  },
  {
    "model": "chatgpt-4o-latest (snapshot unspecified)",
    "score": 900
  },
  {
    "model": "gemma-2-9b-it",
    "score": 859
  },
  {
    "model": "grok-beta",
    "score": 826
  },
  {
    "model": "llama-3.3-70b-instruct",
    "score": 779
  },
  {
    "model": "llama-3.1-405b-instruct",
    "score": 778
  },
  {
    "model": "gpt-4o-mini-2024-07-18",
    "score": 654
  }
];
const board: Leaderboard = {
  benchmark: "aidanbench",
  url: "https://github.com/aidanmclaughlin/AidanBench",
  feed: FEED,
  terms: "The authors publish this source publicly. Robots rules permit this path. Source attribution and licensing apply.",
  async fetch(): Promise<LeaderboardRow[]> {
    return checkedImageRows(IMAGE, SHA256, ROWS);
  },
};
export default board;
