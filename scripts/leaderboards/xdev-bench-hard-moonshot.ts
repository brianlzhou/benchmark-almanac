// xdev-bench-hard-moonshot: whole-benchmark results transcribed on 2026-11-08.
// Image: https://statics.kimi.ai/kimi-blogs/kimi-k3-1/20261023/xdev-bench-hard-results.webp
// The headline is pass@3 in percent. GPT-5.6 Sol is a third-party evaluation.
// Tokens are averages over successful trajectories only, so they remain metrics rather than per-task token fields.
// Two separate visual passes checked every printed score. The image hash must match before rows are returned.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';
const FEED = "https://statics.kimi.ai/kimi-blogs/kimi-k3-1/20261023/xdev-bench-hard-results.webp (transcribed 2026-11-08)";
import { checkedImageRows } from '../lib/boards/transcribed-h1.ts';
const IMAGE = "https://statics.kimi.ai/kimi-blogs/kimi-k3-1/20261023/xdev-bench-hard-results.webp";
const SHA256 = "cd79de99bb432bc4be2877b57c64cb2d2d40428a3ada7f5f59c7b2024d8ca975";
const ROWS: LeaderboardRow[] = [
  {
    "model": "GPT-5.6 Sol",
    "harness": "codex",
    "score": 100,
    "metrics": {
      "averageSuccessRate": 77.8,
      "inputTokensPerSuccess": 93500000,
      "outputTokensPerSuccess": 336000
    }
  },
  {
    "model": "Kimi model w/o cyber risk-reduction",
    "harness": "kimi-code",
    "score": 90.5,
    "metrics": {
      "averageSuccessRate": 71.4,
      "inputTokensPerSuccess": 216400000,
      "outputTokensPerSuccess": 499000
    }
  },
  {
    "model": "DeepSeek-V4.1-Flash",
    "harness": "claude-code",
    "score": 85.7,
    "metrics": {
      "averageSuccessRate": 57.1,
      "inputTokensPerSuccess": 162200000,
      "outputTokensPerSuccess": 1500000
    }
  },
  {
    "model": "Kimi K3.1 Pro",
    "harness": "kimi-code",
    "score": 81,
    "metrics": {
      "averageSuccessRate": 64.5,
      "inputTokensPerSuccess": 159800000,
      "outputTokensPerSuccess": 546000
    }
  },
  {
    "model": "GLM-5.3",
    "harness": "claude-code",
    "score": 57.1,
    "metrics": {
      "averageSuccessRate": 34.9,
      "inputTokensPerSuccess": 381100000,
      "outputTokensPerSuccess": 3600000
    }
  },
  {
    "model": "Kimi K3",
    "harness": "kimi-code",
    "score": 33.3,
    "metrics": {
      "averageSuccessRate": 15.9,
      "inputTokensPerSuccess": 115700000,
      "outputTokensPerSuccess": 475000
    }
  }
];
const board: Leaderboard = {
  benchmark: "xdev-bench-hard-moonshot",
  url: "https://www.kimi.com/blog/kimi-k3-1-pro",
  feed: FEED,
  terms: "The authors publish this source publicly. Robots rules permit this path. Source attribution and licensing apply.",
  async fetch(): Promise<LeaderboardRow[]> {
    return checkedImageRows(IMAGE, SHA256, ROWS);
  },
};
export default board;
