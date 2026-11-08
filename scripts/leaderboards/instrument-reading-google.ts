// Instrument reading: generalized instrument reading accuracy from the ER 2 release.
// The catalog describes the generalized ten-instrument evaluation.
// Rows were transcribed twice from printed chart labels on 2026-11-08.
// Image: https://storage.googleapis.com/gweb-uniblog-publish-prod/images/ER_metrics_comparison_Chart.width-1200.format-webp.webp
// SHA-256: 67af48835d189309e7b3a864d04874d329459a48717026881ab97649c01565c8
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, text } from '../lib/html.ts';
import { paperTables as tables, grid, checked, uncertain } from '../lib/boards/arxiv-h2.ts';
import { chartRows } from '../lib/boards/verified-chart-h2.ts';
const FEED = "https://storage.googleapis.com/gweb-uniblog-publish-prod/images/ER_metrics_comparison_Chart.width-1200.format-webp.webp (transcribed 2026-11-08)";
const board: Leaderboard = {
 benchmark: "instrument-reading-google",
 url: "https://storage.googleapis.com/gweb-uniblog-publish-prod/images/ER_metrics_comparison_Chart.width-1200.format-webp.webp",
 feed: FEED,
 terms: "Public author results read with the Almanac user agent. Attribution and source licensing apply.",

 async fetch(): Promise<LeaderboardRow[]> {
return checked(await chartRows("https://storage.googleapis.com/gweb-uniblog-publish-prod/images/ER_metrics_comparison_Chart.width-1200.format-webp.webp", "67af48835d189309e7b3a864d04874d329459a48717026881ab97649c01565c8", [
  {
    "model": "Claude Opus 5",
    "score": 53.0
  },
  {
    "model": "GPT-5.6 Sol",
    "score": 61.5
  },
  {
    "model": "Gemini Robotics ER 1.6",
    "score": 52.8
  },
  {
    "model": "Gemini 3.6 Flash",
    "score": 52.0
  },
  {
    "model": "Gemini Robotics ER 2",
    "score": 65.7
  }
]));
 },
};
export default board;
