// ProverBench measures the share of 325 Lean problems solved at each sample budget. Table 7 reports the scores and uncertainties.
// The importer checks the source file hash before using the values printed in the chart.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { chartRows } from '../lib/boards/transcribed-chart.ts';

const FEED = "https://raw.githubusercontent.com/deepseek-ai/DeepSeek-Prover-V2/main/DeepSeek_Prover_V2.pdf";
const rows: LeaderboardRow[] = [
  {"model": "STP 7B", "setting": "Pass@32", "score": 27.5, "metrics": {"aimeSolved": 0}, "low": 26.8, "high": 28.2},
  {"model": "STP 7B", "setting": "Pass@128", "score": 31.4, "metrics": {"aimeSolved": 1}, "low": 30.3, "high": 32.5},
  {"model": "STP 7B", "setting": "Pass@512", "score": 36.3, "metrics": {"aimeSolved": 1}},
  {"model": "DeepSeek-Prover-V2 7B", "setting": "non-CoT Pass@32", "score": 47.7, "metrics": {"aimeSolved": 1}, "low": 47.1, "high": 48.3},
  {"model": "DeepSeek-Prover-V2 7B", "setting": "non-CoT Pass@128", "score": 48.8, "metrics": {"aimeSolved": 1}, "low": 48.6, "high": 49.0},
  {"model": "DeepSeek-Prover-V2 7B", "setting": "non-CoT Pass@512", "score": 49.5, "metrics": {"aimeSolved": 1}},
  {"model": "DeepSeek-Prover-V2 671B", "setting": "non-CoT Pass@32", "score": 49.5, "metrics": {"aimeSolved": 1}, "low": 49.0, "high": 50.0},
  {"model": "DeepSeek-Prover-V2 671B", "setting": "non-CoT Pass@128", "score": 51.5, "metrics": {"aimeSolved": 2}, "low": 51.2, "high": 51.8},
  {"model": "DeepSeek-Prover-V2 671B", "setting": "non-CoT Pass@512", "score": 52.3, "metrics": {"aimeSolved": 2}},
  {"model": "DeepSeek-Prover-V2 7B", "setting": "CoT Pass@32", "score": 49, "metrics": {"aimeSolved": 1}, "low": 48.7, "high": 49.3},
  {"model": "DeepSeek-Prover-V2 7B", "setting": "CoT Pass@128", "score": 50.8, "metrics": {"aimeSolved": 1}, "low": 50.3, "high": 51.3},
  {"model": "DeepSeek-Prover-V2 7B", "setting": "CoT Pass@512", "score": 51.7, "metrics": {"aimeSolved": 1}},
  {"model": "DeepSeek-Prover-V2 671B", "setting": "CoT Pass@32", "score": 52.9, "metrics": {"aimeSolved": 4}, "low": 52.0, "high": 53.8},
  {"model": "DeepSeek-Prover-V2 671B", "setting": "CoT Pass@128", "score": 56.5, "metrics": {"aimeSolved": 5}, "low": 56.0, "high": 57.0},
  {"model": "DeepSeek-Prover-V2 671B", "setting": "CoT Pass@512", "score": 59.1, "metrics": {"aimeSolved": 6}},
];

const board: Leaderboard = {
  benchmark: "deepseek-proverbench",
  url: "https://raw.githubusercontent.com/deepseek-ai/DeepSeek-Prover-V2/main/DeepSeek_Prover_V2.pdf",
  terms: "Public author-hosted report on GitHub. Read the raw PDF and credit Table 7.",
  aliases: {"DeepSeek-Prover-V2 671B": "deepseek-prover-v2-671b"},
  parts: {"aimeSolved": "AIME 24&25 (problems solved out of 15)"},
  feed: FEED,
  fetch: () => chartRows(FEED, "c583fda9ddf5a74da91cfc1f7e50e56627303b40f9f6571927aeb8fa25eb1131", rows),
};
export default board;
