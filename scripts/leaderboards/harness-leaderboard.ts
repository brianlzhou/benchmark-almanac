// The Harness Leaderboard tests coding harnesses with fixed models on Terminal-Bench 2.1 and DeepSWE.
// The headline is the macro resolve rate: the mean of the two benchmarks' resolve rates, with its interval, as the
// board's documentation defines the score. The live board's default Overall index also weighs cost, so it is kept
// as a labeled stat.
// The full stage runs each task three times. Pooled model and effort entries would duplicate the individual runs.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://joelniklaus-harness-leaderboard.hf.space/api/index';
type Stats = { overall: number, overall_ci: number[], macro: number, ci: number[], complete: boolean,
  n_trials: number, n_scored: number, n_infra: number, cost_per_trial: number, tokens_per_trial: number,
  calls_per_trial: number, agent_s_per_trial: number, pass_any3: number, pass_all3: number,
  benchmarks: Record<string, { rate: number, ci: number[] }> };
type Index = { leaderboard: Record<string, { stages: { full: { efforts: Record<string, { harnesses: Record<string, Stats> }> } } }>,
  config: { models: Record<string, { display: string }>, harnesses: Record<string, { display: string, vendor: string }>,
    benchmarks: Record<string, { display: string }>, attempts: { full: number } } };
const board: Leaderboard = {
  benchmark: 'harness-leaderboard', url: 'https://huggingface.co/spaces/joelniklaus/harness-leaderboard', feed,
  terms: 'The Hugging Face Space declares Apache 2.0. https://huggingface.co/spaces/joelniklaus/harness-leaderboard/blob/main/README.md',
  harnesses: 'system',
  stats: {
    overallIndex: { name: 'Overall index', unit: 'index', better: 'higher', note: 'The board’s default ranking, which combines the resolve rate with cost.' },
    passAt3: { name: 'pass@3', unit: '%', better: 'higher' },
    pass3: { name: 'pass^3', unit: '%', better: 'higher', note: 'Share of tasks solved in all three attempts.' },
    totalTokens: { name: 'Total tokens per trial', unit: 'tokens' },
    callsPerTrial: { name: 'Model calls per trial', unit: 'count' },
    agentSeconds: { name: 'Agent runtime per trial', unit: 'seconds', better: 'lower' },
    totalTrials: { name: 'Total trials', unit: 'count' },
    scoredTrials: { name: 'Scored trials', unit: 'count' },
    infrastructureFailures: { name: 'Infrastructure failures', unit: 'count', better: 'lower' },
  },
  async fetch() {
    const { config, leaderboard } = await fetchJson<Index>(feed);
    board.parts = Object.fromEntries(Object.entries(config.benchmarks).map(([key, b]) => [key, { name: b.display, unit: '%' }]));
    const rows: LeaderboardRow[] = [];
    for (const [id, model] of Object.entries(config.models)) {
      for (const [effort, group] of Object.entries(leaderboard[id].stages.full.efforts)) {
        if (effort === '_all') continue;
        for (const [key, s] of Object.entries(group.harnesses)) {
          if (!s.complete) continue;
          if (![s.overall, s.overall_ci[0], s.overall_ci[1], s.macro, s.ci[0], s.ci[1]].every(Number.isFinite))
            throw new Error('Missing overall or performance score');
          const metrics: Record<string, number> = { overallIndex: s.overall,
            passAt3: s.pass_any3 * 100, pass3: s.pass_all3 * 100, totalTokens: s.tokens_per_trial, callsPerTrial: s.calls_per_trial,
            agentSeconds: s.agent_s_per_trial, totalTrials: s.n_trials, scoredTrials: s.n_scored, infrastructureFailures: s.n_infra };
          for (const part of Object.keys(config.benchmarks)) {
            const b = s.benchmarks[part];
            if (![b.rate, ...b.ci].every(Number.isFinite)) throw new Error('Missing benchmark result');
            metrics[part] = b.rate * 100;
            metrics[part+'Low'] = b.ci[0] * 100;
            metrics[part+'High'] = b.ci[1] * 100;
          }
          rows.push({ model: model.display, harness: config.harnesses[key].display, agentOrg: config.harnesses[key].vendor,
            setting: effort + ' effort', score: s.macro * 100, low: s.ci[0] * 100, high: s.ci[1] * 100,
            cost: s.cost_per_trial, trials: config.attempts.full, metrics });
        }
      }
    }
    return checked(rows, 72);
  },
};
export default board;
