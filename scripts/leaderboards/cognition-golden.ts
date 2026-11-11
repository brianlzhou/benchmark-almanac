// Cognition Golden: full evaluation score for Devin configurations.
// The production Devin row does not identify an underlying model and stays unlisted.
// Rows were transcribed twice from printed chart labels on 2026-11-08.
// Image: https://cdn.sanity.io/images/2mc9cv2v/production/af90acf737d652594185fdc30b8e7ffe0c80a0a1-1600x1061.png?w=1600&fit=max
// SHA-256: 01027b4c5213256f7a18a5626d0e9e33cb88a88e7dcbe5680f0eca7957a654bb
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { chartRows } from '../lib/boards/transcribed-chart.ts';
const FEED = "https://cdn.sanity.io/images/2mc9cv2v/production/af90acf737d652594185fdc30b8e7ffe0c80a0a1-1600x1061.png?w=1600&fit=max (transcribed 2026-11-08)";
const board: Leaderboard = {
 benchmark: "cognition-golden",
 url: "https://cdn.sanity.io/images/2mc9cv2v/production/af90acf737d652594185fdc30b8e7ffe0c80a0a1-1600x1061.png?w=1600&fit=max",
 feed: FEED,
 terms: "Public author results read with the Almanac user agent. Attribution and source licensing apply.",

 async fetch(): Promise<LeaderboardRow[]> {
return checked(await chartRows("https://cdn.sanity.io/images/2mc9cv2v/production/af90acf737d652594185fdc30b8e7ffe0c80a0a1-1600x1061.png?w=1600&fit=max", "01027b4c5213256f7a18a5626d0e9e33cb88a88e7dcbe5680f0eca7957a654bb", [
  {
    "model": "GPT-4o (snapshot unspecified)",
    "harness": "Devin-Base",
    "score": 25.9
  },
  {
    "model": "o1-mini",
    "harness": "Devin-Base",
    "score": 34.6
  },
  {
    "model": "o1-preview",
    "harness": "Devin-Base",
    "score": 51.8
  },
  {
    "model": "Devin production (model unspecified)",
    "score": 74.2
  }
]));
 },
};
export default board;
