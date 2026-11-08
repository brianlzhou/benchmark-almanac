// OfficeQA: the agent-harness chart reports exact-answer correctness over the whole benchmark.
// The README identifies the starred Gemini 3.1 Pro run as Antigravity, distinct from Gemini CLI.
// The paper predates these refreshed agent results. The public repository tree contains no score data file.
// Rows were transcribed twice from printed chart labels on 2026-11-08.
// Image: https://raw.githubusercontent.com/databricks/officeqa/HEAD/figures/officeqa_pro_agent_harness_performance.png
// SHA-256: 07c23a70c189c84ab808067929402d3b636ce81e46520faca981a178e02065ad
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, text } from '../lib/html.ts';
import { paperTables as tables, grid, checked, uncertain } from '../lib/boards/arxiv-h2.ts';
import { chartRows } from '../lib/boards/verified-chart-h2.ts';
const FEED = "https://raw.githubusercontent.com/databricks/officeqa/HEAD/figures/officeqa_pro_agent_harness_performance.png (transcribed 2026-11-08)";
const board: Leaderboard = {
 benchmark: "officeqa-pro",
 url: "https://github.com/databricks/officeqa",
 feed: FEED,
 terms: "Public author results read with the Almanac user agent. Attribution and source licensing apply.",

 async fetch(): Promise<LeaderboardRow[]> {
return checked(await chartRows("https://raw.githubusercontent.com/databricks/officeqa/HEAD/figures/officeqa_pro_agent_harness_performance.png", "07c23a70c189c84ab808067929402d3b636ce81e46520faca981a178e02065ad", [
  {
    "model": "Gemini 3 Pro",
    "score": 3,
    "harness": "Gemini CLI"
  },
  {
    "model": "Gemini 3.1 Pro Preview",
    "score": 19.6,
    "harness": "Gemini CLI"
  },
  {
    "model": "Gemini 3.1 Pro Preview",
    "score": 39.1,
    "harness": "Antigravity CLI"
  },
  {
    "model": "GPT-5.1",
    "score": 15,
    "harness": "Codex SDK"
  },
  {
    "model": "GPT-5.4",
    "score": 41.4,
    "harness": "Codex SDK"
  },
  {
    "model": "GPT-5.5",
    "score": 57.1,
    "harness": "Codex SDK"
  },
  {
    "model": "GPT-5.6 Sol",
    "score": 60.2,
    "harness": "Codex SDK"
  },
  {
    "model": "Claude Opus 4.5",
    "score": 38.4,
    "harness": "Claude Agent SDK"
  },
  {
    "model": "Claude Opus 4.6",
    "score": 51.1,
    "harness": "Claude Agent SDK"
  },
  {
    "model": "Claude Opus 4.7",
    "score": 46.6,
    "harness": "Claude Agent SDK"
  },
  {
    "model": "Claude Opus 4.8",
    "score": 48.9,
    "harness": "Claude Agent SDK"
  },
  {
    "model": "Claude Fable 5",
    "score": 60.9,
    "harness": "Claude Agent SDK"
  },
  {
    "model": "Claude Opus 5",
    "score": 60.9,
    "harness": "Claude Agent SDK"
  }
]));
 },
};
export default board;
