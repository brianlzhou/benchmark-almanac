// finch-finworkbench: whole-benchmark scores transcribed on 2026-11-08.
// Image: https://huggingface.co/datasets/FinWorkBench/Finch/resolve/main/figs/exp_results.jpg
// Automated-evaluation pass rate is the common headline for all eight systems. Human-evaluation pass rates remain metrics. Product and API are full-benchmark harnesses.
// Two separate visual passes agreed. A changed SHA-256 requires a new transcription.
import type { Leaderboard, LeaderboardRow } from './types.ts';
const FEED = "https://huggingface.co/datasets/FinWorkBench/Finch/resolve/main/figs/exp_results.jpg (transcribed 2026-11-08)";
import { checkedImageRows } from '../lib/boards/transcribed-image.ts';
const IMAGE = "https://huggingface.co/datasets/FinWorkBench/Finch/resolve/main/figs/exp_results.jpg";
const SHA256 = "82b19be823218dd3a84fd2802ebcadf154f8f218543fd945a654607276001b79";
const ROWS: LeaderboardRow[] = [
  {
    "model": "GPT-5.1 Pro",
    "score": 41.9,
    "harness": "Product",
    "metrics": {
      "humanPassRate": 38.4
    }
  },
  {
    "model": "Claude Sonnet 4.5",
    "score": 29.1,
    "harness": "Product",
    "metrics": {
      "humanPassRate": 25.0
    }
  },
  {
    "model": "Claude Opus 4.5",
    "score": 43.0,
    "harness": "Product"
  },
  {
    "model": "GPT-5.1",
    "score": 32.0,
    "harness": "Finch API harness"
  },
  {
    "model": "Claude Sonnet 4.5",
    "score": 20.3,
    "harness": "Finch API harness"
  },
  {
    "model": "Gemini 3 Pro Preview",
    "score": 27.3,
    "harness": "Finch API harness"
  },
  {
    "model": "Grok 4",
    "score": 23.8,
    "harness": "Finch API harness"
  },
  {
    "model": "Qwen3 Max",
    "score": 14.5,
    "harness": "Finch API harness"
  }
];
const board: Leaderboard = {
  benchmark: "finch-finworkbench",
  url: "https://github.com/FinWorkBench/Finch",
  feed: FEED,
  terms: "The authors publish this source publicly. Robots rules permit this path. Source attribution and licensing apply.",
  async fetch(): Promise<LeaderboardRow[]> {
    return checkedImageRows(IMAGE, SHA256, ROWS);
  },
};
export default board;
