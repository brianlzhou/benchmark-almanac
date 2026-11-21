// PPTGen-Bench tests agentic text-to-PowerPoint generation with aesthetic and critical-fault grading.
// The score is the benchmark's reported percentage score, where higher is better.
// This importer reads the appendix chart in Tencent's Hy4 model card and guards its SHA-256.
import type {Leaderboard, LeaderboardRow} from './types.ts';
import {checkedImageRows} from '../lib/boards/transcribed-image.ts';
import {checked} from '../lib/boards/arxiv-span-tables.ts';

const IMAGE = 'https://huggingface.co/tencent/Hy4/resolve/main/assets/benchmark-appendix.jpg';
const board: Leaderboard = {benchmark: 'pptgen-bench-tencent', url: 'https://huggingface.co/tencent/Hy4#appendix-benchmark-results', feed: `${IMAGE} (transcribed 2026-11-20)`, static: 'paper', terms: 'Hugging Face model card terms. https://huggingface.co/terms-of-service', async fetch() {
  const rows: LeaderboardRow[] = [
    {model: 'Hy4 preview', score: 49.0}, {model: 'Hy4', score: 60.9}, {model: 'GLM-5.3', score: 53.9},
    {model: 'DeepSeek-V4.1-Flash-1017', score: 62.5}, {model: 'Kimi K3.1 Pro', score: 64.5},
    {model: 'GPT-6.1 Sol', score: 66.5}, {model: 'Claude Opus 5.5', score: 67.7},
  ];
  return checked(await checkedImageRows(IMAGE, '7ce08997cd3c67a54db99d03bd1405c8079f3ab4b8abeddb342a5679834436c2', rows), 7);
}};
export default board;
