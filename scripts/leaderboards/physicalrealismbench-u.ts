// Reka's joint realism F1 requires detection and localization of a physics violation. Table 4
// in Reka's research article prints F1 fractions for each input format. Values here are percentages.
import type { Leaderboard } from './types.ts';
import { chartRows } from '../lib/boards/transcribed-chart.ts';
const feed = "https://reka.ai/_framer/framerusercontent.com/images/k6c3IWTCDPF3VyWyEMppRzuwiUI.png";
const board: Leaderboard = {
  benchmark: 'physicalrealismbench-u',
  url: "https://reka.ai/labs/research/physicalrealismbench-attributable-physical-realism-evaluation-for-video-world-models",
  feed,
  terms: "The old leaderboard and its robots.txt redirect to Reka. Reka's terms apply to the public research article and its attributed Table 4.",
  stats: { classF1: { name: 'Classification F1', unit: '%', better: 'higher' }, drop: { name: 'Performance drop', unit: '%', better: 'lower' } },
  async fetch() {
    const values: [string, string, number, number, number][] = [
      ['GPT-5.5', 'Frames', 60.8, 66.5, 5.7], ['GPT-5', 'Frames', 41.5, 48.5, 6.9],
      ['Gemini 3.1 Pro', 'Video', 30.4, 41, 10.6], ['Gemini 3.5 Flash', 'Video', 28.8, 42.7, 13.9],
      ['Gemini 3.5 Flash', 'Frames', 28.8, 41.6, 12.8], ['Gemini 2.5 Pro', 'Video', 22.3, 34.8, 12.5],
      ['Claude Opus 4.8', 'Frames', 21.3, 32.1, 10.9], ['Qwen3-VL Plus', 'Video', 19, 35.1, 16.1],
      ['Gemini 2.5 Flash', 'Video', 18, 29.9, 11.8], ['Qwen3.5 Plus', 'Video', 14.3, 48.2, 33.9],
      ['Gemini 2.5 Flash', 'Frames', 13.9, 28.6, 14.6],
    ];
    return chartRows(feed, 'e445eafbf92de057facade04c0ebf1a73bb835d1c004c134be97b48e6e3228b5',
      values.map(([model, setting, score, classF1, drop]) => ({ model, setting, score, submitter: 'Reka Labs', metrics: { classF1, drop } })));
  },
};
export default board;
