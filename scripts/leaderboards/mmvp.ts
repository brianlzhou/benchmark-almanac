// mmvp: overall accuracy transcribed from the authors' image on 2026-11-08.
//  Image: https://raw.githubusercontent.com/tsb0601/MMVP/main/imgs/mllm_results.png
//  Two independent visual passes agreed on every model row. Human and random references are excluded.
//  fetch() checks the SHA-256 before returning the transcribed rows. A changed image requires a new transcription.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';
const FEED = "https://raw.githubusercontent.com/tsb0601/MMVP/main/imgs/mllm_results.png (transcribed 2026-11-08)";
import { checkedImageRows } from '../lib/boards/transcribed-h1.ts';
const IMAGE = "https://raw.githubusercontent.com/tsb0601/MMVP/main/imgs/mllm_results.png";
const SHA256 = "77c9e07753a368baf1783cf9a81cbee18a862d10876a35990ffecb84012cffeb";
const ROWS: LeaderboardRow[] = [
  {
    "model": "Gemini",
    "score": 40.7
  },
  {
    "model": "GPT-4V",
    "score": 38.7
  },
  {
    "model": "LLaVA-1.5",
    "score": 24.7
  },
  {
    "model": "Bard",
    "score": 19
  },
  {
    "model": "Bing Chat",
    "score": 17.3
  },
  {
    "model": "InstructBLIP",
    "score": 16.7
  },
  {
    "model": "mini-GPT4",
    "score": 12.7
  },
  {
    "model": "LLaVA",
    "score": 6
  }
];
const board: Leaderboard = {
  benchmark: "mmvp",
  url: "https://arxiv.org/abs/2401.06209",
  feed: FEED,
  terms: "The authors publish this source publicly. Robots rules permit this path. Source attribution and licensing apply.",
  async fetch(): Promise<LeaderboardRow[]> {
    return checkedImageRows(IMAGE, SHA256, ROWS);
  },
};
export default board;
