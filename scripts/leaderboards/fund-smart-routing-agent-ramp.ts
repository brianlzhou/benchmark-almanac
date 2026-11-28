// Ramp ranks fund routing models by override rate: how often a user would have to override the fund a model picked.
// It publishes only multiples of the best model's rate (GPT-5.1 = 1.00x), so the score is that multiple.
import type { Leaderboard } from './types.ts';
import { rampBundle, rampTerms } from './accounting-autocoding-ramp.ts';
import { jsLiteral } from '../lib/html.ts';

const board: Leaderboard = {
  benchmark: 'fund-smart-routing-agent-ramp', url: 'https://builders.ramp.com/post/financial-benchmarks', feed: 'https://builders.ramp.com/post/financial-benchmarks', terms: rampTerms,
  async fetch() {
    const js = await rampBundle();
    const start = [...js.matchAll(/\[\{name:"[^"]+",provider:"[^"]+",rateNx:[\d.]+\}/g)];
    if (start.length !== 1) throw new Error('Missing or ambiguous override-rate chart');
    const runs = jsLiteral<{ name:string, rateNx:number }[]>(js,start[0].index!);
    if (runs.length < 10) throw new Error('Incomplete override-rate chart');
    return runs.map(r => {
      if (!r.name || !Number.isFinite(r.rateNx)) throw new Error('Invalid override-rate result');
      return { model:r.name, score:r.rateNx };
    });
  },
};
export default board;
