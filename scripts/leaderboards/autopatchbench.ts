// AutoPatchBench: Testing pass is the strict final score.
// Fuzzing pass and patch validity remain metrics. Iteration distributions are not per-task costs.
// Rows were transcribed twice from printed chart labels on 2026-11-08.
// Image: https://engineering.fb.com/wp-content/uploads/2025/04/AutoPatchBench-image-2.png?w=1024
// SHA-256: 915a3b857475c5677ebe1847ecd434e4b4d494cd8adf0536f4c6282d0dda576f
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { chartRows } from '../lib/boards/transcribed-chart.ts';
const FEED = "https://engineering.fb.com/wp-content/uploads/2025/04/AutoPatchBench-image-2.png?w=1024 (transcribed 2026-11-08)";
const board: Leaderboard = {
 benchmark: "autopatchbench",
 url: "https://engineering.fb.com/wp-content/uploads/2025/04/AutoPatchBench-image-2.png?w=1024",
 feed: FEED,
 terms: "Public author results read with the Almanac user agent. Attribution and source licensing apply.",

 async fetch(): Promise<LeaderboardRow[]> {
return checked(await chartRows("https://engineering.fb.com/wp-content/uploads/2025/04/AutoPatchBench-image-2.png?w=1024", "915a3b857475c5677ebe1847ecd434e4b4d494cd8adf0536f4c6282d0dda576f", [
  {
    "model": "Claude 3.7 Sonnet",
    "score": 10.6,
    "metrics": {
      "fuzzingPass": 38.1,
      "patchValid": 66.4
    }
  },
  {
    "model": "Llama 4 Maverick",
    "score": 10.6,
    "metrics": {
      "fuzzingPass": 38.9,
      "patchValid": 64.6
    }
  },
  {
    "model": "Llama 3.3 70B Instruct",
    "score": 11.5,
    "metrics": {
      "fuzzingPass": 38.9,
      "patchValid": 62.8
    }
  },
  {
    "model": "GPT-4o (snapshot unspecified)",
    "score": 8.8,
    "metrics": {
      "fuzzingPass": 34.5,
      "patchValid": 61.1
    }
  },
  {
    "model": "Gemini 1.5 Pro (snapshot unspecified)",
    "score": 5.3,
    "metrics": {
      "fuzzingPass": 36.3,
      "patchValid": 61.1
    }
  },
  {
    "model": "Claude 3.5 Sonnet (snapshot unspecified)",
    "score": 5.3,
    "metrics": {
      "fuzzingPass": 41.6,
      "patchValid": 61.1
    }
  }
]));
 },
};
export default board;
