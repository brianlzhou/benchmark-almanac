// LongBench-Chat: the author leaderboard prints whole-benchmark GPT-4 judge scores on the 1 to 10 scale.
// The paper tables contain training ablations, not the complete main model leaderboard. Context lengths identify model variants, not dataset subsets.
// Rows were transcribed twice from printed chart labels on 2026-11-08.
// Image: https://raw.githubusercontent.com/THUDM/LongAlign/HEAD/assets/leaderboard.png
// SHA-256: 44ebdeeaf77500a0d0d24bf3dac4d645701616ad80a5a8e14e75d217dfa7fe97
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, text } from '../lib/html.ts';
import { paperTables as tables, grid, checked, uncertain } from '../lib/boards/arxiv-h2.ts';
import { chartRows } from '../lib/boards/verified-chart-h2.ts';
const FEED = "https://raw.githubusercontent.com/THUDM/LongAlign/HEAD/assets/leaderboard.png (transcribed 2026-11-08)";
const board: Leaderboard = {
 benchmark: "longbench-chat",
 url: "https://raw.githubusercontent.com/THUDM/LongAlign/HEAD/assets/leaderboard.png",
 feed: FEED,
 terms: "Public author results read with the Almanac user agent. Attribution and source licensing apply.",

 async fetch(): Promise<LeaderboardRow[]> {
return checked(await chartRows("https://raw.githubusercontent.com/THUDM/LongAlign/HEAD/assets/leaderboard.png", "44ebdeeaf77500a0d0d24bf3dac4d645701616ad80a5a8e14e75d217dfa7fe97", [
  {
    "model": "GPT-4-1106-preview",
    "score": 8.4
  },
  {
    "model": "GLM-4-128k",
    "score": 8.14
  },
  {
    "model": "Claude-2.1",
    "score": 8.03
  },
  {
    "model": "LongAlign-13B-64k",
    "score": 7.02
  },
  {
    "model": "InternLM2-20b-200k",
    "score": 6.66
  },
  {
    "model": "ChatGLM3-6B-128k",
    "score": 6.52
  },
  {
    "model": "LongAlign-7B-64k",
    "score": 6.38
  },
  {
    "model": "InternLM2-7b-200k",
    "score": 6.29
  },
  {
    "model": "LongAlign-6B-64k",
    "score": 6.21
  },
  {
    "model": "Mistral-7B-Instruct-v0.2",
    "score": 5.84
  },
  {
    "model": "ChatGLM3-6B-32k",
    "score": 4.55
  },
  {
    "model": "Vicuna-7b-v1.5-16k",
    "score": 3.51
  },
  {
    "model": "Orion-14B-LongChat",
    "score": 3.17
  },
  {
    "model": "LongChat-7b-v1.5-32k",
    "score": 3.06
  }
]));
 },
};
export default board;
