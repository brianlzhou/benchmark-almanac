// Ramp tests whether models identify businesses subject to partner restrictions.
// Its detection error chart gives the false negative and false positive rates as multiples of the best rates.
// Ramp calls identifying restricted businesses the most vital component.
import type { Leaderboard } from './types.ts';
import { rampBundle, rampTerms } from './accounting-autocoding-ramp.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { jsLiteral } from '../lib/html.ts';

const feed = 'https://builders.ramp.com/post/financial-benchmarks';
export default {
  benchmark: 'partner-restrictions-compliance-ramp', url: feed, feed, terms: rampTerms,
  headline: 'Ramp omits the combined score. The headline is the false negative rate as a multiple of the lowest rate. Lower is better.',
  chart: { title: 'Detection Error Tradeoff', x: { key: 'falsePositive', label: 'False positive rate', unit: 'multiple', better: 'lower' },
    y: { key: 'score', label: 'False negative rate', unit: 'multiple', better: 'lower' } },
  async fetch() {
    const js = await rampBundle();
    const starts = [...js.matchAll(/\[\{name:"[^"]+",provider:"[^"]+",normFpRate:/g)];
    if (starts.length !== 1) throw new Error('Missing or ambiguous detection error chart');
    const runs = jsLiteral<{ name: string, normFpRate: number, normFnr: number }[]>(js, starts[0].index!);
    return checked(runs.map(r => {
      if (!Number.isFinite(r.normFpRate)) throw new Error('Missing false positive rate');
      return { model: r.name, score: r.normFnr, metrics: { falsePositive: r.normFpRate } };
    }), 12);
  },
} satisfies Leaderboard;
