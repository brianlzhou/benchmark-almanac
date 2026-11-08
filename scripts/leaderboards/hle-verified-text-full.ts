// HLE-Verified chart, transcribed twice on 2026-11-08. Paper Section 5.1 states:
// "Unless otherwise specified, all evaluation sets used in this section are the text-only subset of HLE."
// The chart repeats the paper scores, with one added model. It does not establish the cataloged 1,811-item scope.
// These are revised Full text-only scores, not the Confident subset with uncertain questions removed.
import type { Leaderboard } from './types.ts';
import { checkChart, CHART_TERMS } from '../lib/boards/github-round3-t.ts';

const IMAGE = 'https://raw.githubusercontent.com/SKYLENAGE-AI/HLE-Verified/main/figure/leaderboard_HLE_Verified.png';
const SHA256 = 'a70eb678b1b3cb71635a9a4d1f7f3675d75dd2e4a5129891025095304acccf31';
const ROWS: [string, number][] = [
  [
    "Gemini 3 Pro",
    48.2
  ],
  [
    "Claude Opus 4.6",
    46.8
  ],
  [
    "GPT-5.2",
    43.3
  ],
  [
    "Claude Opus 4.5",
    38.8
  ],
  [
    "Qwen3-Max-Thinking",
    38.2
  ],
  [
    "Qwen3.5-Plus",
    37.6
  ],
  [
    "DeepSeek-V3.2",
    36.4
  ],
  [
    "Grok 4.1 (Fast)",
    29.0
  ]
];
const board: Leaderboard = {
  benchmark: 'hle-verified-text-full',
  url: 'https://github.com/SKYLENAGE-AI/HLE-Verified',
  feed: `${IMAGE} (transcribed 2026-11-08)`, terms: CHART_TERMS,
  async fetch() {
    await checkChart(IMAGE, SHA256);
    return ROWS.map(([model, score]) => ({ model: /^(Gemini 3 Pro|Qwen3.5-Plus)$/.test(model) ? model + ' (snapshot unspecified)' : model, score, setting: model === 'GPT-5.2' ? 'high' : model === 'Grok 4.1 (Fast)' ? 'reasoning' : undefined }));
  },
};
export default board;
