// ABC-Bench: Overall average pass@1 covers all 224 tasks, not individual programming languages.
// The chart identifies OpenHands and thinking settings. The arXiv HTML endpoint returns 404. The project blog has no result table.
// Rows were transcribed twice from printed chart labels on 2026-11-08.
// Image: https://raw.githubusercontent.com/OpenMOSS/ABC-Bench/HEAD/figs/main-results.png
// SHA-256: e0e7e7217a0ef678f666e0fb3e9b0cabbd075d5c7b23b51aaade15ff48d18c8f
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { chartRows } from '../lib/boards/transcribed-chart.ts';
const FEED = "https://raw.githubusercontent.com/OpenMOSS/ABC-Bench/HEAD/figs/main-results.png (transcribed 2026-11-08)";
const board: Leaderboard = {
 benchmark: "abc-bench-backend-coding",
 url: "https://raw.githubusercontent.com/OpenMOSS/ABC-Bench/HEAD/figs/main-results.png",
 feed: FEED,
 terms: "Public author results read with the Almanac user agent. Attribution and source licensing apply.",

 async fetch(): Promise<LeaderboardRow[]> {
return checked(await chartRows("https://raw.githubusercontent.com/OpenMOSS/ABC-Bench/HEAD/figs/main-results.png", "e0e7e7217a0ef678f666e0fb3e9b0cabbd075d5c7b23b51aaade15ff48d18c8f", [
  {
    "model": "Qwen3-8B",
    "score": 8.3,
    "harness": "OpenHands",
    "setting": "thinking on"
  },
  {
    "model": "Qwen3-32B",
    "score": 8.9,
    "harness": "OpenHands",
    "setting": "thinking on"
  },
  {
    "model": "Qwen3-Coder-30B-A3B",
    "score": 28.6,
    "harness": "OpenHands",
    "setting": "thinking off"
  },
  {
    "model": "Qwen3-Coder-480B-A35B",
    "score": 43.1,
    "harness": "OpenHands",
    "setting": "thinking off"
  },
  {
    "model": "Nex-N1-32B",
    "score": 34.5,
    "harness": "OpenHands",
    "setting": "thinking off"
  },
  {
    "model": "Nex-N1-671B",
    "score": 42.1,
    "harness": "OpenHands",
    "setting": "thinking off"
  },
  {
    "model": "DeepSeek-V3.2",
    "score": 50.1,
    "harness": "OpenHands",
    "setting": "thinking off"
  },
  {
    "model": "GLM 4.7",
    "score": 40.1,
    "harness": "OpenHands",
    "setting": "thinking on"
  },
  {
    "model": "GPT-5",
    "score": 49.4,
    "harness": "OpenHands",
    "setting": "thinking on"
  },
  {
    "model": "Gemini 2.5 Pro",
    "score": 25.0,
    "harness": "OpenHands",
    "setting": "thinking on"
  },
  {
    "model": "Claude Sonnet 4.5",
    "score": 63.2,
    "harness": "OpenHands",
    "setting": "thinking on"
  }
]));
 },
};
export default board;
