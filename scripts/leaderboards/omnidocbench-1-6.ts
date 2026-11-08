// OmniDocBench v1.6 (OpenDataLab), the current board in the main-branch README. v1.6 (2026-04-10) added 296
// harder pages and the MGAM matching method. v1.7 (2026-04-30) added skills-based evaluation without new
// pages, so its results stay in this record. Read through omnidocRows in omnidocbench-1-5.ts: the end-to-end
// table's Overall (higher is better) is the score. Plain "GPT-4o" does not say which snapshot ran and is
// left out.
import type { Leaderboard } from './types.ts';
import { omnidocRows } from './omnidocbench-1-5.ts';

const FEED = 'https://raw.githubusercontent.com/opendatalab/OmniDocBench/main/README.md';

const board: Leaderboard = {
  benchmark: 'omnidocbench-1-6',
  url: 'https://github.com/opendatalab/OmniDocBench#end-to-end-evaluation',
  feed: `${FEED} (end-to-end table, Overall)`,
  terms: 'README of opendatalab/OmniDocBench, which is Apache-2.0.',
  aliases: {
    'Gemini 3 Pro': 'gemini-3-pro',
    'Gemini 3 Flash': 'gemini-3-flash',
    'GLM-OCR': 'glm-ocr',
    'InternVL3.5-241B': 'internvl3-5-241b-a28b',
    // the 2025-10-28 update names the run Qwen3-VL-235B-A22B-Instruct
    'Qwen3-VL-235B': 'qwen3-vl-235b-a22b-instruct',
  },
  fetch: () => omnidocRows(FEED, ['GPT-4o']),
};
export default board;
