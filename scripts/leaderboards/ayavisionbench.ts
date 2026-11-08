// AyaVisionBench: whole-set strict win rate against the single reference Aya Vision 8B.
// The author labels wins and losses from Aya Vision 8B perspective. Its printed losses are each opponent model's wins.
// Every row therefore uses the same reference, not different opponents. No tie-adjusted score is invented.
// The reference model has no self-comparison score and is excluded. The m-WildVision panel is a separate benchmark.
// Ambiguous model variants remain unlisted.
// Rows were transcribed twice from printed chart labels on 2026-11-08.
// Image: https://storage.ghost.io/c/81/47/8147eb50-617d-4929-b563-3922b88421fd/content/images/2025/03/Aya-Vision-8B-Combined-Win-Rates-2.png
// SHA-256: 6a699672406b32580bba9fea2baa2a173693eea2bf2198908fa1737be30eab3c
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, text } from '../lib/html.ts';
import { paperTables as tables, grid, checked, uncertain } from '../lib/boards/arxiv-h2.ts';
import { chartRows } from '../lib/boards/verified-chart-h2.ts';
const FEED = "https://storage.ghost.io/c/81/47/8147eb50-617d-4929-b563-3922b88421fd/content/images/2025/03/Aya-Vision-8B-Combined-Win-Rates-2.png (transcribed 2026-11-08)";
const board: Leaderboard = {
 benchmark: "ayavisionbench",
 url: "https://cohere.com/blog/aya-vision",
 feed: FEED,
 terms: "Public author results read with the Almanac user agent. Attribution and source licensing apply.",

 async fetch(): Promise<LeaderboardRow[]> {
return checked(await chartRows("https://storage.ghost.io/c/81/47/8147eb50-617d-4929-b563-3922b88421fd/content/images/2025/03/Aya-Vision-8B-Combined-Win-Rates-2.png", "6a699672406b32580bba9fea2baa2a173693eea2bf2198908fa1737be30eab3c", [
  {
    "model": "Gemini Flash 1.5 8B (snapshot unspecified)",
    "score": 35.3,
    "setting": "reference Aya Vision 8B",
    "metrics": {
      "lossRate": 55.8,
      "tieRate": 8.9
    }
  },
  {
    "model": "Llama 3.2 11B Vision (variant unspecified)",
    "score": 19,
    "setting": "reference Aya Vision 8B",
    "metrics": {
      "lossRate": 72.1,
      "tieRate": 8.9
    }
  },
  {
    "model": "Qwen2.5 VL 7B (variant unspecified)",
    "score": 38.3,
    "setting": "reference Aya Vision 8B",
    "metrics": {
      "lossRate": 52.1,
      "tieRate": 9.6
    }
  },
  {
    "model": "Molmo 7B (variant unspecified)",
    "score": 11.8,
    "setting": "reference Aya Vision 8B",
    "metrics": {
      "lossRate": 78.6,
      "tieRate": 9.7
    }
  },
  {
    "model": "Pixtral 12B",
    "score": 41.8,
    "setting": "reference Aya Vision 8B",
    "metrics": {
      "lossRate": 49.2,
      "tieRate": 9
    }
  },
  {
    "model": "Pangea 7B",
    "score": 19,
    "setting": "reference Aya Vision 8B",
    "metrics": {
      "lossRate": 70,
      "tieRate": 11.1
    }
  }
]));
 },
};
export default board;
