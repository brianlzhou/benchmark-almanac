// OpenEQA: LLM-Match scores from the project page default EM-EQA results figure.
// EM-EQA covers the complete 1,636-question set. A-EQA covers a different smaller subset and is excluded.
// Frame budgets and blind prompting are whole-set configurations. Human reference is excluded.
// Paper Appendix D identifies LLaMA-2 70B Chat and GPT-4-0613. Claude 3 remains unspecified.
// The SVG stores labels as paths, so its printed scores require visual transcription.
// Rows were transcribed twice from printed chart labels on 2026-11-08.
// Image: https://open-eqa.github.io/assets/images/multi-modal-llms.svg
// SHA-256: 6b857670be55fe467ec465ae6eddc90ac3832f4e2738c658154bfa6b3a641c22
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { chartRows } from '../lib/boards/transcribed-chart.ts';
const FEED = "https://open-eqa.github.io/assets/images/multi-modal-llms.svg (transcribed 2026-11-08)";
const board: Leaderboard = {
 benchmark: "openeqa",
 url: "https://open-eqa.github.io/",
 feed: FEED,
 terms: "Public author results read with the Almanac user agent. Attribution and source licensing apply.",

 async fetch(): Promise<LeaderboardRow[]> {
return checked(await chartRows("https://open-eqa.github.io/assets/images/multi-modal-llms.svg", "6b857670be55fe467ec465ae6eddc90ac3832f4e2738c658154bfa6b3a641c22", [
  {
    "model": "LLaMA-2-70B Chat",
    "score": 28.3,
    "setting": "blind"
  },
  {
    "model": "gpt-4-0613",
    "score": 33.5,
    "setting": "blind"
  },
  {
    "model": "Claude 3 (variant unspecified)",
    "score": 36.3,
    "setting": "20 frames"
  },
  {
    "model": "Gemini 1.0 Pro Vision",
    "score": 44.9,
    "setting": "15 frames"
  },
  {
    "model": "GPT-4V (snapshot unspecified)",
    "score": 54.6,
    "setting": "15 frames"
  },
  {
    "model": "GPT-4V (snapshot unspecified)",
    "score": 55.3,
    "setting": "50 frames"
  }
]));
 },
};
export default board;
