// streamingbench: overall accuracy transcribed from the authors' image on 2026-11-08.
//  Image: https://raw.githubusercontent.com/THUNLP-MT/StreamingBench/main/figs/result_1.png
//  Two independent visual passes agreed on every model row. Human and random references are excluded.
//  fetch() checks the SHA-256 before returning the transcribed rows. A changed image requires a new transcription.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';
const FEED = "https://raw.githubusercontent.com/THUNLP-MT/StreamingBench/main/figs/result_1.png (transcribed 2026-11-08)";
import { checkedImageRows } from '../lib/boards/transcribed-h1.ts';
const IMAGE = "https://raw.githubusercontent.com/THUNLP-MT/StreamingBench/main/figs/result_1.png";
const SHA256 = "085f260b5ec0051b63c291b70e5c4147c2fd23918aa0acebd666edbc37f8437f";
const ROWS: LeaderboardRow[] = [
  {
    "model": "Gemini 1.5 pro (snapshot unspecified)",
    "score": 67.07,
    "setting": "1 fps",
    "metrics": {
      "realTime": 75.69,
      "omniSource": 60.22,
      "contextual": 48.73
    }
  },
  {
    "model": "GPT-4o (snapshot unspecified)",
    "score": 60.15,
    "setting": "64 frames",
    "metrics": {
      "realTime": 73.28,
      "omniSource": 44.5,
      "contextual": 38.7
    }
  },
  {
    "model": "Claude 3.5 Sonnet (snapshot unspecified)",
    "score": 57.68,
    "setting": "20 frames",
    "metrics": {
      "realTime": 72.44,
      "omniSource": 36.8,
      "contextual": 37.7
    }
  },
  {
    "model": "LLaVA-OneVision-7B",
    "score": 56.36,
    "setting": "32 frames",
    "metrics": {
      "realTime": 71.12,
      "omniSource": 38.4,
      "contextual": 32.74
    }
  },
  {
    "model": "Qwen2-VL-7B",
    "score": 54.14,
    "setting": "0.2-1 fps",
    "metrics": {
      "realTime": 69.04,
      "omniSource": 34.9,
      "contextual": 31.66
    }
  },
  {
    "model": "MiniCPM-V 2.6-8B",
    "score": 53.85,
    "setting": "32 frames",
    "metrics": {
      "realTime": 67.44,
      "omniSource": 35.0,
      "contextual": 34.97
    }
  },
  {
    "model": "LLaVA-NeXT-Video-32B",
    "score": 52.77,
    "setting": "64 frames",
    "metrics": {
      "realTime": 66.96,
      "omniSource": 34.9,
      "contextual": 30.79
    }
  },
  {
    "model": "InternVL-V2-8B",
    "score": 51.4,
    "setting": "16 frames",
    "metrics": {
      "realTime": 63.72,
      "omniSource": 35.8,
      "contextual": 32.42
    }
  },
  {
    "model": "Kangaroo-7B",
    "score": 51.1,
    "setting": "64 frames",
    "metrics": {
      "realTime": 64.6,
      "omniSource": 34.2,
      "contextual": 30.06
    }
  },
  {
    "model": "LongVA-7B",
    "score": 48.66,
    "setting": "128 frames",
    "metrics": {
      "realTime": 59.96,
      "omniSource": 35.4,
      "contextual": 29.95
    }
  },
  {
    "model": "VILA-1.5-8B",
    "score": 43.2,
    "setting": "14 frames",
    "metrics": {
      "realTime": 52.32,
      "omniSource": 33.1,
      "contextual": 27.35
    }
  },
  {
    "model": "Video-CCAM-14B",
    "score": 42.53,
    "setting": "96 frames",
    "metrics": {
      "realTime": 53.96,
      "omniSource": 29.7,
      "contextual": 22.88
    }
  },
  {
    "model": "Video-LLaMA2-7B",
    "score": 40.4,
    "setting": "32 frames",
    "metrics": {
      "realTime": 49.52,
      "omniSource": 32.4,
      "contextual": 21.93
    }
  }
];
const board: Leaderboard = {
  benchmark: "streamingbench",
  url: "https://github.com/THUNLP-MT/StreamingBench",
  feed: FEED,
  terms: "The authors publish this source publicly. Robots rules permit this path. Source attribution and licensing apply.",
  async fetch(): Promise<LeaderboardRow[]> {
    return checkedImageRows(IMAGE, SHA256, ROWS);
  },
};
export default board;
