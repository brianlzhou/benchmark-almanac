// Qwen's maker-published ToolcallFormatIFBench panel, transcribed 2026-11-10.
// Only this internal benchmark panel is imported. Other panels in the source image are excluded.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checkedImageRows } from '../lib/boards/transcribed-h1.ts';
const IMAGE = 'https://qianwen-res.oss-cn-beijing.aliyuncs.com/Qwen3.6/Figures/qwen3.6_max_preview_score.png';
const ROWS: LeaderboardRow[] = [
  {
    "model": "Qwen3.6 Max Preview",
    "score": 86.1
  },
  {
    "model": "Qwen3.6 Plus",
    "score": 83.3
  },
  {
    "model": "Qwen3.5 Plus",
    "score": 80.1
  },
  {
    "model": "Claude Opus 4.5",
    "score": 84.2
  },
  {
    "model": "GLM-5.1",
    "score": 60.1
  }
];
const board: Leaderboard = {
 benchmark: 'toolcallformatifbench', url: 'https://qwen.ai/blog?id=qwen3.6-max-preview', feed: IMAGE + ' (transcribed 2026-11-10)',
 terms: 'Qwen publishes this comparison image publicly; the almanac credits Qwen and links the source.',
 fetch: () => checkedImageRows(IMAGE, 'e01c316dd7a53af03cfe7f537cae02e2827f430aa933476612578a5299ab0f75', ROWS),
};
export default board;
