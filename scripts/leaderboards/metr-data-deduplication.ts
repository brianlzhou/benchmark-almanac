// metr-data-deduplication: whole-benchmark results transcribed on 2026-11-08.
// Image: https://metr.org/assets/images/evaluations/openai_o1_preview_report/sep2024_o1_preview_report_general_heatmap.png
// The data-deduplication family row is the complete cataloged task. Fractions become percentages. Blank cells are unscored.
// One shortened label differed between passes. A third view confirmed the advisor and actor configuration.
// Two separate visual passes checked every printed score. The image hash must match before rows are returned.
import type { Leaderboard, LeaderboardRow } from './types.ts';
const FEED = "https://metr.org/assets/images/evaluations/openai_o1_preview_report/sep2024_o1_preview_report_general_heatmap.png (transcribed 2026-11-08)";
import { checkedImageRows } from '../lib/boards/transcribed-image.ts';
const IMAGE = "https://metr.org/assets/images/evaluations/openai_o1_preview_report/sep2024_o1_preview_report_general_heatmap.png";
const SHA256 = "2ce0ad4d867488b02df055ef0736ff394cc04731ccfc2a110e7c2a4356717548";
const ROWS: LeaderboardRow[] = [
  {
    "model": "gpt-4o (METR 2024 snapshot)",
    "score": 0,
    "harness": "advisor to gpt-4o",
    "setting": "n=6"
  },
  {
    "model": "o1-mini (METR 2024 snapshot)",
    "score": 1.0,
    "harness": "advisor to gpt-4o",
    "setting": "n=6"
  },
  {
    "model": "o1-preview (METR 2024 snapshot)",
    "score": 4.0,
    "harness": "adapted",
    "setting": "n=1"
  },
  {
    "model": "o1-preview (METR 2024 snapshot)",
    "score": 2.0,
    "harness": "adapted",
    "setting": "n=6"
  },
  {
    "model": "o1-preview-early (METR 2024 snapshot)",
    "score": 4.0,
    "harness": "advisor to gpt-4o",
    "setting": "n=6"
  }
];
const board: Leaderboard = {
  benchmark: "metr-data-deduplication",
  url: "https://metr.org/evaluations/openai-o1-preview-report/",
  feed: FEED,
  terms: "The authors publish this source publicly. Robots rules permit this path. Source attribution and licensing apply.",
  async fetch(): Promise<LeaderboardRow[]> {
    return checkedImageRows(IMAGE, SHA256, ROWS);
  },
};
export default board;
