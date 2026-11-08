// E-Bench-Code: the Internal E-Bench-Code row in the Hy4-preview results appendix.
// The author uses each model highest available reasoning setting.
// Rows were transcribed twice from printed chart labels on 2026-11-08.
// Image: https://raw.githubusercontent.com/Tencent-Hunyuan/Hy4-preview/main/assets/benchmark-appendix.jpg
// SHA-256: 02c751bf51c52c52cc02094561d7144bbfe3e27084d48d8a405d580da3554e21
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, text } from '../lib/html.ts';
import { paperTables as tables, grid, checked, uncertain } from '../lib/boards/arxiv-h2.ts';
import { chartRows } from '../lib/boards/verified-chart-h2.ts';
const FEED = "https://raw.githubusercontent.com/Tencent-Hunyuan/Hy4-preview/main/assets/benchmark-appendix.jpg (transcribed 2026-11-08)";
const board: Leaderboard = {
 benchmark: "e-bench-code-tencent",
 url: "https://raw.githubusercontent.com/Tencent-Hunyuan/Hy4-preview/main/assets/benchmark-appendix.jpg",
 feed: FEED,
 terms: "Public author results read with the Almanac user agent. Attribution and source licensing apply.",

 async fetch(): Promise<LeaderboardRow[]> {
return checked(await chartRows("https://raw.githubusercontent.com/Tencent-Hunyuan/Hy4-preview/main/assets/benchmark-appendix.jpg", "02c751bf51c52c52cc02094561d7144bbfe3e27084d48d8a405d580da3554e21", [
  {
    "model": "Hy3",
    "score": 64.4,
    "setting": "highest available reasoning"
  },
  {
    "model": "Hy4 preview",
    "score": 79.0,
    "setting": "highest available reasoning"
  },
  {
    "model": "DeepSeek V4 Pro 0813",
    "score": 64.3,
    "setting": "highest available reasoning"
  },
  {
    "model": "Qwen 3.8 Max",
    "score": 67.1,
    "setting": "highest available reasoning"
  },
  {
    "model": "GLM 5.3",
    "score": 66.5,
    "setting": "highest available reasoning"
  },
  {
    "model": "Kimi K3",
    "score": 77.6,
    "setting": "highest available reasoning"
  },
  {
    "model": "GPT-5.6 Sol",
    "score": 83.3,
    "setting": "highest available reasoning"
  },
  {
    "model": "Claude Opus 5",
    "score": 82.7,
    "setting": "highest available reasoning"
  }
]));
 },
};
export default board;
