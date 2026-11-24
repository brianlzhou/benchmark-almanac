// SWE-Race tests coding agents on Python concurrency bugs. The default full-set board ranks by pass@1.
// Evaligo's results.json contains that percentage, split results and asymmetric interval widths.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const feed = 'https://labs.evaligo.com/swe-race/data/results.json';
interface Result { v: number; lo: number; hi: number; cost: number; cps: number; steps: number; tokens: number;
  attempts: number; att: number; n: number; atk: number; added: string }
const parts = { hard: 'Hard', public: 'Public', private: 'Private', composite: 'Composites' };
const board: Leaderboard = {
  benchmark: 'swe-race', url: 'https://labs.evaligo.com/swe-race', feed, parts, reference: ['BenchGen'],
  terms: 'Evaligo links the public results JSON from its benchmark page.',
  chart: {
    title: 'Pass@1 vs. cost per solved task',
    x: { key: 'costPerSolved', label: 'Cost per solved task', unit: '$', better: 'lower' },
    y: { key: 'score', label: 'Pass@1', unit: '%', better: 'higher' },
    note: 'Evaligo SWE-Race scatter chart comparing pass@1 against cost per solved task.',
  },
  stats: {
    costPerSolved: { name: 'Cost per solved task', unit: 'usd', better: 'lower' },
    steps: { name: 'Steps', unit: 'count', better: 'lower' },
    tasks: { name: 'Tasks', unit: 'count' },
    attemptsPerTask: { name: 'Attempts per task', unit: 'count', better: 'lower' },
    passAtK: { name: 'Pass@k', unit: '%', better: 'higher' },
    tokensPerAttempt: { name: 'Tokens per attempt', unit: 'tokens', better: 'lower' },
  },
  async fetch() {
    const d = await fetchJson<{ benchmark: string; models: Record<string,{ name: string; views: Record<string,Result> }> }>(feed);
    if (d.benchmark !== 'SWE-Race' || Object.keys(d.models).length < 3) throw new Error('Missing SWE-Race models');
    return Object.values(d.models).map(({name,views}) => {
      const r = views.full;
      if (!name || !r || ![r.v,r.lo,r.hi,r.attempts].every(Number.isFinite)) throw new Error('Invalid SWE-Race result');
      const metrics = Object.fromEntries(Object.keys(parts).map(k => {
        if (!Number.isFinite(views[k]?.v)) throw new Error('Missing SWE-Race split ' + k);
        return [k,views[k].v];
      }));
      return { model: name, score: r.v, low: r.v - r.lo, high: r.v + r.hi, cost: r.cost, trials: r.attempts,
        date: r.added, setting: 'medium, 100 steps, offline', harness: 'BenchGen',
        metrics: { ...metrics, tokensPerAttempt: r.tokens, costPerSolved: r.cps, steps: r.steps,
          tasks: r.n, attemptsPerTask: r.att, passAtK: r.atk } };
    });
  },
};
export default board;
