// Human proximity: accuracy at the published one-meter threshold.
// The unrelated safety instruction following panel is excluded.
// Rows were transcribed twice from printed chart labels on 2026-11-08.
// Image: https://storage.googleapis.com/gweb-uniblog-publish-prod/images/Safety_Performance_light_-_Chart.width-1200.format-webp.webp
// SHA-256: 7b9ee5d407c87d0664e95d59f7cde675e634f8c7d61b8422f8948fd6dc737079
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, text } from '../lib/html.ts';
import { paperTables as tables, grid, checked, uncertain } from '../lib/boards/arxiv-h2.ts';
import { chartRows } from '../lib/boards/verified-chart-h2.ts';
const FEED = "https://storage.googleapis.com/gweb-uniblog-publish-prod/images/Safety_Performance_light_-_Chart.width-1200.format-webp.webp (transcribed 2026-11-08)";
const board: Leaderboard = {
 benchmark: "human-proximity-google",
 url: "https://storage.googleapis.com/gweb-uniblog-publish-prod/images/Safety_Performance_light_-_Chart.width-1200.format-webp.webp",
 feed: FEED,
 terms: "Public author results read with the Almanac user agent. Attribution and source licensing apply.",

 async fetch(): Promise<LeaderboardRow[]> {
return checked(await chartRows("https://storage.googleapis.com/gweb-uniblog-publish-prod/images/Safety_Performance_light_-_Chart.width-1200.format-webp.webp", "7b9ee5d407c87d0664e95d59f7cde675e634f8c7d61b8422f8948fd6dc737079", [
  {
    "model": "Claude Opus 5",
    "score": 77.1
  },
  {
    "model": "GPT-5.6 Sol",
    "score": 83.4
  },
  {
    "model": "Gemini Robotics ER 1.6",
    "score": 51.1
  },
  {
    "model": "Gemini Robotics ER 2",
    "score": 93.0
  }
]));
 },
};
export default board;
