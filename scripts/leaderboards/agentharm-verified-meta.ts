// AgentHarm Verified measures average harm on malicious tasks and false refusals on benign tasks. Figure 27 prints both rates.
// The importer checks the source file hash before using the values printed in the chart.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { chartRows } from '../lib/boards/transcribed-chart.ts';

const FEED = "https://research.meta.ai/static/muse-spark-1-1-evaluation-report";
const rows: LeaderboardRow[] = [
  {"model": "Muse Spark 1.1", "score": 3.4, "metrics": {"falseRefusal": 16.5}},
  {"model": "GPT-5.5", "score": 1.5, "metrics": {"falseRefusal": 21.6}},
  {"model": "Claude Opus 4.8", "score": 0, "metrics": {"falseRefusal": 37.5}},
  {"model": "Gemini 3.1 Pro", "score": 20, "metrics": {"falseRefusal": 5.7}},
];

const board: Leaderboard = {
  benchmark: "agentharm-verified-meta",
  url: "https://research.meta.ai/static/muse-spark-1-1-evaluation-report",
  terms: "Meta serves the evaluation report publicly and robots.txt allows general agents. Credit Figure 27.",
  parts: {"falseRefusal": "False Refusal Rate"},
  feed: FEED,
  fetch: () => chartRows(FEED, "cd25634e0c8a3960d47dadfe6f49eefd3c12f6f62ad0dfbdf1cb4c96b5b5ade9", rows),
};
export default board;
