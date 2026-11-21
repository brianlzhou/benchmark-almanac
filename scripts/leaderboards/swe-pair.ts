// SWE-Pair ranks coding models by full-set pass@1 on paired bugs, as a percentage.
// Evaligo links its results JSON below the leaderboard and lists each reasoning effort separately.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const url = 'https://labs.evaligo.com/swe-pair';
const feed = url + '/data/results.json';
interface View {
  v: number; lo: number; hi: number; n: number; att: number; attempts: number;
  cost: number; cps: number; steps: number; tokens: number; added: string; atk: number;
}
interface Entry {
  name: string;
  views: { full: View; public: View; private: View; hard: View | null };
}
const board: Leaderboard = {
  benchmark: 'swe-pair', url, feed,
  terms: 'Evaligo Labs links the public results download directly from the leaderboard.',
  parts: { hard: 'Hard', public: 'Public', private: 'Private' },
  stats: {
    cost_per_solved_task: { name: 'Cost per solved task', unit: 'usd', better: 'lower' },
    steps: { name: 'Steps', unit: 'count', better: 'lower' },
    average_total_tokens: { name: 'Average total tokens', unit: 'tokens' },
    tasks: { name: 'Tasks', unit: 'count' },
    attempts_per_task: { name: 'Attempts per task', unit: 'count', better: 'lower' },
    pass_at_k: { name: 'Pass@k', unit: '%', better: 'higher' },
  },
  async fetch() {
    const data = await fetchJson<{ entries: Record<string, Entry> }>(feed);
    const entries = Object.values(data.entries);
    if (entries.length < 5) throw new Error('Expected at least five SWE-Pair entries');
    return entries.map(({ name, views }) => {
      const [model, setting] = name.split(' · ');
      const v = views.full;
      const metrics: Record<string, number> = {
        cost_per_solved_task: v.cps, steps: v.steps, totalTokens: v.tokens,
        tasks: v.n, attempts_per_task: v.att, pass_at_k: v.atk,
        public: views.public.v, private: views.private.v,
      };
      if (views.hard !== null) metrics.hard = views.hard.v;
      if (!model || !setting || !v.added ||
          ![v.v, v.cost, v.lo, v.hi, v.attempts, ...Object.values(metrics)].every(Number.isFinite)) {
        throw new Error('Incomplete SWE-Pair result for ' + name);
      }
      return { model, setting, score: v.v, cost: v.cost, date: v.added, trials: v.attempts,
        low: +(v.v - v.lo).toFixed(1), high: +(v.v + v.hi).toFixed(1), metrics };
    });
  },
};
export default board;
