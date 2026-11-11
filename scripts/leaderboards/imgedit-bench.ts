// ImgEdit-Bench: published Overall scores, transcribed twice on 2026-11-08.
// The chart caption says: "Overall" is calculated by averaging all scores across tasks.
// The chart uses GPT-4.1 as judge. We copy its printed Overall values without recomputing them.
import type { Leaderboard } from './types.ts';
import { checkChart, CHART_TERMS } from '../lib/boards/transcribed-github-chart.ts';

const IMAGE = 'https://raw.githubusercontent.com/PKU-YuanGroup/ImgEdit/main/assets/leaderboard.png';
const SHA256 = '4b0da7fb34e3c16c3b230d59b6e0d7b29a85e26e6dd79872a754fa977ed9c0ba';
const ROWS: [string, number][] = [
  [
    "MagicBrush",
    1.83
  ],
  [
    "Instruct-P2P",
    1.88
  ],
  [
    "AnyEdit",
    2.45
  ],
  [
    "UltraEdit",
    2.7
  ],
  [
    "ICEdit",
    3.05
  ],
  [
    "Step1X-Edit",
    3.06
  ],
  [
    "UniWorld-V1",
    3.26
  ],
  [
    "BAGEL",
    3.42
  ],
  [
    "OmniGen2",
    3.44
  ],
  [
    "Kontext-dev",
    3.71
  ],
  [
    "Ovis-U1",
    3.97
  ],
  [
    "GPT-4o-Image",
    4.2
  ],
  [
    "UniWorld-V2",
    4.49
  ]
];
const board: Leaderboard = {
  benchmark: 'imgedit-bench',
  url: 'https://github.com/PKU-YuanGroup/ImgEdit',
  feed: `${IMAGE} (transcribed 2026-11-08)`, terms: CHART_TERMS,
  aliases: { 'Kontext-dev': 'flux-1-kontext-dev' },
  async fetch() {
    await checkChart(IMAGE, SHA256);
    return ROWS.map(([model, score]) => ({ model: model === 'GPT-4o-Image' ? model + ' (snapshot unspecified)' : model, score }));
  },
};
export default board;
