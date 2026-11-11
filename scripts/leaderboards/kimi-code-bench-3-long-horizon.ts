// Moonshot's maker-published score image, transcribed 2026-11-10.
// All models use maximum thinking effort. Claude may include fallbacks; GPT may include cyberguards.
// Only Kimi Code Bench 3.0 Long-horizon is imported from this multi-benchmark image.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checkedImageRows } from '../lib/boards/transcribed-h1.ts';
const IMAGE = 'https://kimi-img.kimi.ai/pub/slides/kimi-fs/managed-assets/43394bf2-0bfe-4f41-8f93-bb7fb3a079c2.webp';
const ROWS: LeaderboardRow[] = [
  {
    "model": "GPT-6 Astra",
    "score": 66.5,
    "setting": "max",
    "date": "2026-10-23"
  },
  {
    "model": "Kimi K3.1 Pro",
    "score": 61.2,
    "setting": "max",
    "date": "2026-10-23"
  },
  {
    "model": "Claude Fable 5.1",
    "score": 58.8,
    "setting": "max",
    "date": "2026-10-23"
  },
  {
    "model": "Claude Opus 5.5",
    "score": 58.5,
    "setting": "max",
    "date": "2026-10-23"
  },
  {
    "model": "DeepSeek V4.1 Flash 1017",
    "score": 51.5,
    "setting": "max",
    "date": "2026-10-23"
  },
  {
    "model": "GLM-5.3",
    "score": 45.5,
    "setting": "max",
    "date": "2026-10-23"
  }
];
const board: Leaderboard = {
  benchmark: 'kimi-code-bench-3-long-horizon', url: 'https://www.kimi.com/en/blog/kimi-k3-1-pro', feed: IMAGE + ' (transcribed 2026-11-10)',
  terms: 'Moonshot publishes this comparison image publicly; the almanac credits Moonshot AI and links the source.',
  fetch: () => checkedImageRows(IMAGE, 'da7bd9b37dbb885c12590c7b320bb8a94dd855dbf593c5dd866b2ec086eda419', ROWS),
};
export default board;
