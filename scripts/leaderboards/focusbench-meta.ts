// FocusBench whole-benchmark scores from the author release chart. All models use max reasoning.
// Rows were transcribed twice from printed chart labels on 2026-11-08.
// Image: https://research.meta.ai/articles/introducing-muse-wonder/images/focusbench-light-v1.webp
// SHA-256: 1956ec30aad1df21ea9d709624133f0492a4786cb00cc0c5bccd324cb9a0f8c9
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, text } from '../lib/html.ts';
import { paperTables as tables, grid, checked, uncertain } from '../lib/boards/arxiv-h2.ts';
import { chartRows } from '../lib/boards/verified-chart-h2.ts';
const FEED = "https://research.meta.ai/articles/introducing-muse-wonder/images/focusbench-light-v1.webp (transcribed 2026-11-08)";
const board: Leaderboard = {
 benchmark: "focusbench-meta",
 url: "https://research.meta.ai/blog/muse-wonder",
 feed: FEED,
 terms: "Public author results read with the Almanac user agent. Attribution and source licensing apply.",

 async fetch(): Promise<LeaderboardRow[]> {
return checked(await chartRows("https://research.meta.ai/articles/introducing-muse-wonder/images/focusbench-light-v1.webp", "1956ec30aad1df21ea9d709624133f0492a4786cb00cc0c5bccd324cb9a0f8c9", [
  {
    "model": "Muse Wonder Full",
    "score": 54.2,
    "setting": "max"
  },
  {
    "model": "GPT-6 Astra",
    "score": 47.7,
    "setting": "max"
  },
  {
    "model": "Claude Opus 5.5",
    "score": 45.8,
    "setting": "max"
  },
  {
    "model": "Muse Wonder",
    "score": 44.9,
    "setting": "max"
  },
  {
    "model": "Claude Fable 5.1",
    "score": 36.6,
    "setting": "max"
  }
]));
 },
};
export default board;
