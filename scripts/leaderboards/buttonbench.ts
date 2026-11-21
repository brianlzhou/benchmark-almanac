// ButtonBench tests whether language models resist pressing a forbidden button under jailbreak pressure.
// The headline score is the success rate, the percentage of tests where the model did not press the button.
// This importer reads the repository's machine-readable benchmark-results.json ranking.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://raw.githubusercontent.com/adamholter/buttonbench/main/bench/visualizer/data/benchmark-results.json';
interface Entry {
  model?: string;
  successRate?: number;
  correct?: number;
  incorrect?: number;
  errors?: number;
  totalTests?: number;
  averageDuration?: number;
  averageCostPerTest?: number;
  totalCompletionTokens?: number;
  tokensPerSecond?: number;
}
const board: Leaderboard = {
  benchmark: 'buttonbench',
  url: 'https://github.com/adamholter/buttonbench/blob/main/README.md',
  feed: FEED,
  terms: 'The repository is MIT licensed. Results are credited to Adam Holter with a link to the repository.',
  stats: {
    correct: { name: 'Correct tests', unit: 'count' },
    incorrect: { name: 'Incorrect tests', unit: 'count' },
    totalTests: { name: 'Total tests', unit: 'count' },
    latency: { name: 'Average test duration', unit: 'seconds', better: 'lower' },
    tokensPerSecond: { name: 'Token throughput', unit: 'tokens/s', better: 'higher' },
  },
  chart: { title: 'Resistance against average cost per test', x: { key: 'cost', label: 'Average cost per test', unit: '$', better: 'lower' }, y: { key: 'score', label: 'Resistance success rate', unit: '%', better: 'higher' } },
  async fetch() {
    const data = await fetchJson<{ rankings?: Entry[] }>(FEED);
    if (!Array.isArray(data.rankings) || data.rankings.length < 44) throw new Error('ButtonBench: rankings missing or shorter than 44 models');
    const rows: LeaderboardRow[] = [];
    for (const e of data.rankings) {
      if (!e.model || typeof e.successRate !== 'number' || !Number.isFinite(e.successRate)) continue;
      rows.push({
        model: e.model,
        score: e.successRate,
        cost: e.averageCostPerTest,
        tokens: e.totalCompletionTokens && e.totalTests ? e.totalCompletionTokens / e.totalTests : undefined,
        metrics: {
          correct: e.correct ?? 0,
          incorrect: e.incorrect ?? 0,
          errors: e.errors ?? 0,
          totalTests: e.totalTests ?? 0,
          latency: e.averageDuration ? e.averageDuration / 1000 : 0,
          tokensPerSecond: e.tokensPerSecond ?? 0,
        },
      });
    }
    if (rows.length < 44) throw new Error(`ButtonBench: ${rows.length} readable rows, expected at least 44`);
    return rows;
  },
};
export default board;
