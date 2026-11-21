// Veterinary Clinic Ops v2 tests agents on a simulated clinic database. The public dashboard
// reports mean reward per evaluation. Read only version 2 runs and convert reward to percent.
import type { Leaderboard } from './types.ts';
import { primeFeed, primeRows, primeTerms } from './llm-writer-negative-style-prime.ts';

const id = 'nfk2rhd7i1oxuegumhp0xbpm';
const page = 'https://app.primeintellect.ai/dashboard/environments/praesidiumsystems/long-horizon-medical-agent-benchmark-vet-clinic-ops/evals';
const board: Leaderboard = {
  benchmark: 'long-horizon-medical-agent-vet-clinic-ops-2', url: page, feed: primeFeed(id), terms: primeTerms,
  stats: { sum_step_rewards: { name: 'Sum of step rewards', unit: 'score', better: 'higher' }, num_turns: { name: 'Turns', unit: 'count', better: 'lower' }, runSeconds: { name: 'Run duration', unit: 'seconds', better: 'lower' }, examples: { name: 'Examples', unit: 'count' } },
  async fetch() {
    return (await primeRows(id, page, 7, 2)).map(row => ({ ...row, score: row.score * 100 }));
  },
};
export default board;
