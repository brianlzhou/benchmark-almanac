// Evalatro measures progress through Balatro and penalizes illegal moves. The public API supplies the mean game score,
// game counts, cost, tokens and duration for each model configuration.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const feed = "https://evalatro.dev/api";
type Entry = { model: string; avgScore: number; scored: number; avgCostUsd: number; avgTokensOut: number; avgDurationMs: number; attempts: number; stdevScore: number; winRate: number };

const board: Leaderboard = {
  benchmark: "evalatro-2",
  url: "https://evalatro.dev/",
  feed,
  terms: "The runner package declares ISC. I found no separate license for submitted scores. The host returned no readable robots.txt rules.",
  stats: {
    attempts: { name: 'Attempts', unit: 'count' }, completed: { name: 'Completed games', unit: 'count' }, incomplete: { name: 'Incomplete games', unit: 'count' }, won: { name: 'Games won', unit: 'count', better: 'higher' }, winRate: { name: 'Win rate', unit: '%', better: 'higher' },
    stdevScore: { name: 'Score standard deviation', unit: 'score' }, avgAnte: { name: 'Average ante', unit: 'score' }, stdevAnte: { name: 'Ante standard deviation', unit: 'score' }, maxAnte: { name: 'Maximum ante', unit: 'score' },
    avgMoney: { name: 'Average money', unit: 'score', better: 'higher' }, illegalRate: { name: 'Illegal move rate', unit: '%', better: 'lower' }, latency: { name: 'Average duration', unit: 'seconds', better: 'lower' },
  },
  async fetch() {
    const { leaderboard } = await fetchJson<{ leaderboard: Entry[] }>(feed);
    const scored = leaderboard.filter(r => r.scored > 0);
    if (scored.length < 63) throw new Error('Missing scored Evalatro configurations');
    return scored.map(r => {
      const { model, avgScore, scored, avgCostUsd, avgTokensOut, avgDurationMs, ...metrics } = r;
      if (!model || ![avgScore, scored, avgCostUsd, avgTokensOut, avgDurationMs].every(Number.isFinite))
        throw new Error('Incomplete Evalatro result');
      return { model, score: avgScore, trials: scored, cost: avgCostUsd, tokens: avgTokensOut,
        metrics: { ...metrics, latency: avgDurationMs / 1000 } };
    });
  },
};
export default board;
