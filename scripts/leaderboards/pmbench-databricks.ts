// PMBench tests exhaustive fact search over internal enterprise notes.
// The headline is the PMBench column in Table 4 of the KARL paper.
// This importer reads the paper's fixed comparison table.
import type { Leaderboard, LeaderboardRow } from './types.ts';
const rows: LeaderboardRow[] = [
  { model: 'GLM 4.5 Air', score: 33.4 }, { model: 'Qwen 3.5 397B A17B', score: 34.7 },
  { model: 'Minimax m2.5', score: 34.5 }, { model: 'GPT 5', score: 37.5 },
  { model: 'GPT 5.2', score: 37.9 }, { model: 'Claude 4.5 Haiku', score: 35.0 },
  { model: 'Claude 4.5 Sonnet', score: 32.6 }, { model: 'Claude 4.5 Opus', score: 39.1 },
  { model: 'Claude 4.6 Sonnet', score: 43.8 }, { model: 'Claude 4.6 Opus', score: 46.1 },
  { model: 'KARL-TREC', score: 37.5 }, { model: 'KARL-BCP', score: 32.4 },
  { model: 'KARL', score: 35.7 }, { model: 'KARL', setting: 'parallel N = 3', score: 44.8 },
  { model: 'KARL', setting: 'parallel N = 10', score: 47.8 }, { model: 'KARL', setting: 'parallel N = 20', score: 49.0 },
];
const board: Leaderboard = {
  benchmark: 'pmbench-databricks', static: 'paper',
  url: 'https://www.databricks.com/blog/meet-karl-faster-agent-enterprise-knowledge-powered-custom-rl',
  feed: 'https://www.databricks.com/karl.pdf',
  terms: 'Databricks publishes the paper publicly. Table 4 is credited to Databricks AI Research.',
  async fetch() { return rows; },
};
export default board;
