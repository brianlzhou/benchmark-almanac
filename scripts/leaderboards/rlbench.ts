// RLBench evaluates simulated robot manipulation. CodeSOTA ranks the standard 18-task protocol by average task success rate.
// Each task has 100 demonstrations. The full environment contains more tasks than this leaderboard evaluates.
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import type { Leaderboard } from './types.ts';
const feed = 'https://www.codesota.com/data/benchmarks.json';
type Result = {datasetId: string, metric: string, model: string, value: number, verified: boolean};
const board: Leaderboard = {
  benchmark: 'rlbench', host: 'CodeSOTA', url: 'https://www.codesota.com/benchmark/rlbench', feed,
  terms: 'CodeSOTA labels its benchmark results CC BY 4.0. https://creativecommons.org/licenses/by/4.0/',
  headline: 'CodeSOTA reports average success on the 18-task RLBench protocol with 100 demonstrations per task.',
  verified: 'CodeSOTA marks the result as verified',
  async fetch() {
    const {results} = await fetchJson<{results: Result[]}>(feed);
    return checked(results.filter(r => r.datasetId === 'rlbench' && r.metric === 'success-rate').map(r => ({
      model: r.model, score: r.value, verified: r.verified, setting: '18 tasks, 100 demonstrations per task',
    })), 3);
  },
};
export default board;
