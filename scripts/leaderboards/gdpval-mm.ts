// GDPval-MM: whole-benchmark score from the MiniMax M2.5 release.
// Only the GDPval-MM panel supplies rows.
// Rows were transcribed twice from printed chart labels on 2026-11-08.
// Image: https://raw.githubusercontent.com/MiniMax-AI/MiniMax-M2.5/main/figures/bench_7.png
// SHA-256: 8ff3840ebd22c220307a958a356b89c02c89bed3afb4ddadb37526c6e1be8998
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { chartRows } from '../lib/boards/transcribed-chart.ts';
const FEED = "https://raw.githubusercontent.com/MiniMax-AI/MiniMax-M2.5/main/figures/bench_7.png (transcribed 2026-11-08)";
const board: Leaderboard = {
 benchmark: "gdpval-mm",
 url: "https://raw.githubusercontent.com/MiniMax-AI/MiniMax-M2.5/main/figures/bench_7.png",
 feed: FEED,
 terms: "Public author results read with the Almanac user agent. Attribution and source licensing apply.",

 async fetch(): Promise<LeaderboardRow[]> {
return checked(await chartRows("https://raw.githubusercontent.com/MiniMax-AI/MiniMax-M2.5/main/figures/bench_7.png", "8ff3840ebd22c220307a958a356b89c02c89bed3afb4ddadb37526c6e1be8998", [
  {
    "model": "MiniMax-M2.5",
    "score": 59
  },
  {
    "model": "MiniMax-M2.1",
    "score": 24.6
  },
  {
    "model": "Claude Opus 4.5",
    "score": 61.1
  },
  {
    "model": "Claude Opus 4.6",
    "score": 73.5
  },
  {
    "model": "Gemini 3 Pro",
    "score": 28.1
  },
  {
    "model": "GPT-5.2",
    "score": 54.5
  }
]));
 },
};
export default board;
