// visfactor: overall accuracy transcribed from the authors' image on 2026-11-08.
//  Image: https://raw.githubusercontent.com/CUHK-ARISE/VisFactor/main/assets/leaderboard.png
//  Two independent visual passes agreed on every model row. Human and random references are excluded.
//  fetch() checks the SHA-256 before returning the transcribed rows. A changed image requires a new transcription.
import type { Leaderboard, LeaderboardRow } from './types.ts';
const FEED = "https://raw.githubusercontent.com/CUHK-ARISE/VisFactor/main/assets/leaderboard.png (transcribed 2026-11-08)";
import { checkedImageRows } from '../lib/boards/transcribed-image.ts';
const IMAGE = "https://raw.githubusercontent.com/CUHK-ARISE/VisFactor/main/assets/leaderboard.png";
const SHA256 = "a5b2d97187ee46510e2a2ac469e6740afefc9e1e16af67be97767b71e3905383";
const ROWS: LeaderboardRow[] = [
  {
    "model": "Claude-Opus-4.5",
    "score": 24.5
  },
  {
    "model": "Claude-Sonnet-3.5 (snapshot unspecified)",
    "score": 20.1
  },
  {
    "model": "Claude-Sonnet-3.7",
    "score": 25.2
  },
  {
    "model": "Claude-Sonnet-4",
    "score": 17.4
  },
  {
    "model": "Claude-Sonnet-4.5",
    "score": 21.5
  },
  {
    "model": "Claude-Sonnet-4.6",
    "score": 24.7
  },
  {
    "model": "Gemini-2.5-Flash (snapshot unspecified)",
    "score": 17.6
  },
  {
    "model": "Gemini-2.5-Pro (snapshot unspecified)",
    "score": 17.4
  },
  {
    "model": "Gemini-3.0-Flash",
    "score": 40.5
  },
  {
    "model": "Gemini-3.0-Pro",
    "score": 45.8
  },
  {
    "model": "Gemini-3.1-Pro",
    "score": 54
  },
  {
    "model": "GLM-5V-Turbo",
    "score": 27.2
  },
  {
    "model": "GPT-4.1-2025-04-14",
    "score": 21.3
  },
  {
    "model": "GPT-4o-2024-11-20",
    "score": 21.4
  },
  {
    "model": "GPT-4o-Mini-2024-07-18",
    "score": 16.4
  },
  {
    "model": "GPT-5-Mini-2025-08-07",
    "score": 24.3
  },
  {
    "model": "GPT-5.1-2025-11-13",
    "score": 30.2
  },
  {
    "model": "GPT-5.2-2025-12-11",
    "score": 33.6
  },
  {
    "model": "GPT-5.5-2026-04-23",
    "score": 55.9
  },
  {
    "model": "Kimi-K2.5",
    "score": 27.3
  },
  {
    "model": "LLaMA-3.2-11B-Vision",
    "score": 2.4
  },
  {
    "model": "LLaMA-3.2-90B-Vision",
    "score": 4.1
  },
  {
    "model": "Moonshot-V1-128K-Vision",
    "score": 9.5
  },
  {
    "model": "o1-2024-12-17",
    "score": 20.8
  },
  {
    "model": "o3-2025-04-16",
    "score": 24.3
  },
  {
    "model": "o4-Mini-2025-04-16",
    "score": 23.2
  },
  {
    "model": "Qwen-VL-Max (snapshot unspecified)",
    "score": 21.2
  },
  {
    "model": "Qwen-VL-Plus (snapshot unspecified)",
    "score": 21.6
  },
  {
    "model": "Qwen-2-VL-72B",
    "score": 16.5
  },
  {
    "model": "Qwen-2.5-VL-32B",
    "score": 13.3
  },
  {
    "model": "Qwen-2.5-VL-72B",
    "score": 10.9
  },
  {
    "model": "Qwen-3-VL-235B-A22B",
    "score": 20.4
  },
  {
    "model": "Qwen-3.5-Plus",
    "score": 39.1
  },
  {
    "model": "Qwen-3.6-Plus",
    "score": 38.2
  },
  {
    "model": "Seed-1.5-VL",
    "score": 23.7
  },
  {
    "model": "Seed-1.6-Thinking",
    "score": 21.5
  },
  {
    "model": "Seed-2.0-Mini-0202",
    "score": 19.8
  },
  {
    "model": "Seed-2.0-Lite-0415",
    "score": 40.6
  },
  {
    "model": "Seed-2.0-Pro-0215",
    "score": 39.6
  }
];
const board: Leaderboard = {
  benchmark: "visfactor",
  url: "https://github.com/CUHK-ARISE/VisFactor",
  feed: FEED,
  terms: "The authors publish this source publicly. Robots rules permit this path. Source attribution and licensing apply.",
  async fetch(): Promise<LeaderboardRow[]> {
    return checkedImageRows(IMAGE, SHA256, ROWS);
  },
};
export default board;
