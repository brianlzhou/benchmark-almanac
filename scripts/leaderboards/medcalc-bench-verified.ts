// MedCalc-Bench Verified scores clinical calculations against corrected labels. Anthropic reports mean accuracy over five Python-assisted runs in Figure 2.21.2.A.
// The importer checks the source file hash before using the values printed in the chart.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { chartRows } from '../lib/boards/transcribed-chart.ts';

const FEED = "https://assets.claude.com/bbd8ef16d70b7a1665f14f306ee88b53f686aa75.pdf";
const rows: LeaderboardRow[] = [
  {"model": "Claude Sonnet 4.5", "score": 81.93, "setting": "64K thinking", "harness": "Python REPL", "trials": 5},
  {"model": "Claude Opus 4.5", "score": 84.91, "setting": "64K thinking", "harness": "Python REPL", "trials": 5},
  {"model": "Claude Opus 4.6", "score": 85.24, "setting": "Adaptive thinking, max effort", "harness": "Python REPL", "trials": 5},
  {"model": "Claude Sonnet 4.6", "score": 86.24, "setting": "Adaptive thinking, max effort", "harness": "Python REPL", "trials": 5},
];

const board: Leaderboard = {
  benchmark: "medcalc-bench-verified",
  url: "https://assets.claude.com/bbd8ef16d70b7a1665f14f306ee88b53f686aa75.pdf",
  terms: "Public Anthropic system card. The asset host returns 404 for robots.txt. Credit Figure 2.21.2.A.",
  host: "Anthropic",
  feed: FEED,
  fetch: () => chartRows(FEED, "672339ab327e8798578b3559e8489561db5ad25e81b427de4e306393108e90b6", rows),
};
export default board;
