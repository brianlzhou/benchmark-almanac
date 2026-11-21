// Ramp compares expense-policy decisions with human reviewers. Its chart shows normalized disagreement and unsure rates.
// The headline is disagreement as a percentage of the chart's baseline. Each reasoning effort is a separate run.
import type { Leaderboard } from './types.ts';
import { rampArray, rampBundle, rampTerms } from './accounting-autocoding-ramp.ts';

const board: Leaderboard = {
  stats: { unsureRateMultiple: { name: 'Unsure rate multiple', unit: 'score' }, disagreementRateMultiple: { name: 'Disagreement rate multiple', unit: 'score' } },
  benchmark: 'policy-agent-ramp', url: 'https://builders.ramp.com/post/financial-benchmarks', feed: 'https://builders.ramp.com/post/financial-benchmarks', terms: rampTerms,
  async fetch() {
    const runs = rampArray<{name:string, normDisagreement:number, normUnsure:number}>(await rampBundle(), 'normDisagreement',33);
    return runs.map(r => {
      if (!r.name || ![r.normDisagreement,r.normUnsure].every(Number.isFinite)) throw new Error('Incomplete policy agent result');
      const setting = r.name.match(/-(none|low|medium|high|xhigh|minimal)$/)?.[1];
      return { model:setting ? r.name.slice(0,-setting.length-1) : r.name, setting, score:r.normDisagreement*100,
        metrics:{ unsureRateMultiple:r.normUnsure, disagreementRateMultiple:r.normDisagreement } };
    });
  },
};
export default board;
