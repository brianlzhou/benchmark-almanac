// MM-ClawBench: whole-benchmark accuracy from the MiniMax M2.7 release chart.
// Only the MM-ClawBench panel supplies rows.
// Rows were transcribed twice from printed chart labels on 2026-11-08.
// Image: https://filecdn.minimax.chat/public/4f5db695-e248-481a-9081-311b35ba5a87.jpg
// SHA-256: 28ef4e8ec02080a6e0e47cd060e360c9ed4d770253aae308a91ef708fe926cf7
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { chartRows } from '../lib/boards/transcribed-chart.ts';
const FEED = "https://filecdn.minimax.chat/public/4f5db695-e248-481a-9081-311b35ba5a87.jpg (transcribed 2026-11-08)";
const board: Leaderboard = {
 benchmark: "mm-clawbench",
 url: "https://filecdn.minimax.chat/public/4f5db695-e248-481a-9081-311b35ba5a87.jpg",
 feed: FEED,
 terms: "Public author results read with the Almanac user agent. Attribution and source licensing apply.",

 async fetch(): Promise<LeaderboardRow[]> {
return checked(await chartRows("https://filecdn.minimax.chat/public/4f5db695-e248-481a-9081-311b35ba5a87.jpg", "28ef4e8ec02080a6e0e47cd060e360c9ed4d770253aae308a91ef708fe926cf7", [
  {
    "model": "MiniMax-M2.7",
    "score": 62.7
  },
  {
    "model": "MiniMax-M2.5",
    "score": 57.6
  },
  {
    "model": "Gemini 3.1 Pro",
    "score": 61.8
  },
  {
    "model": "Claude Sonnet 4.6",
    "score": 64.2
  },
  {
    "model": "Claude Opus 4.6",
    "score": 75.4
  },
  {
    "model": "GPT-5.4",
    "score": 73.6
  }
]));
 },
};
export default board;
