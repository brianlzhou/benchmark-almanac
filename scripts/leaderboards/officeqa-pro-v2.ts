// OfficeQA: the agent-harness chart reports exact-answer correctness over the whole benchmark.
// The README identifies the starred Gemini 3.1 Pro run as Antigravity, distinct from Gemini CLI.
// The paper predates these refreshed agent results. The public repository tree contains no score data file.
// Rows were transcribed twice from printed chart labels on 2026-11-08.
// Image: https://raw.githubusercontent.com/databricks/officeqa/HEAD/figures/officeqa_pro_v2_agent_harness_performance.png
// SHA-256: d97762a15ad277575c2f567c4e3a318b6bb1d4e4d4d0008cd4f5c7953bae3253
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { chartRows } from '../lib/boards/transcribed-chart.ts';
const FEED = "https://raw.githubusercontent.com/databricks/officeqa/HEAD/figures/officeqa_pro_v2_agent_harness_performance.png (transcribed 2026-11-08)";
const board: Leaderboard = {
 benchmark: "officeqa-pro-v2",
 url: "https://github.com/databricks/officeqa",
 feed: FEED,
 terms: "Public author results read with the Almanac user agent. Attribution and source licensing apply.",

 async fetch(): Promise<LeaderboardRow[]> {
return checked(await chartRows("https://raw.githubusercontent.com/databricks/officeqa/HEAD/figures/officeqa_pro_v2_agent_harness_performance.png", "d97762a15ad277575c2f567c4e3a318b6bb1d4e4d4d0008cd4f5c7953bae3253", [
  {
    "model": "Gemini 3.1 Pro",
    "score": 14.4,
    "harness": "Gemini Antigravity"
  },
  {
    "model": "Gemini 3.6 Flash",
    "score": 12.2,
    "harness": "Gemini Antigravity"
  },
  {
    "model": "GPT-5.5",
    "score": 38.9,
    "harness": "Codex"
  },
  {
    "model": "GPT-5.6 Sol",
    "score": 33.3,
    "harness": "Codex"
  },
  {
    "model": "Claude Opus 4.8",
    "score": 32.2,
    "harness": "Claude Code"
  },
  {
    "model": "Claude Fable 5",
    "score": 45.6,
    "harness": "Claude Code"
  },
  {
    "model": "Claude Opus 5",
    "score": 54.4,
    "harness": "Claude Code"
  }
]));
 },
};
export default board;
