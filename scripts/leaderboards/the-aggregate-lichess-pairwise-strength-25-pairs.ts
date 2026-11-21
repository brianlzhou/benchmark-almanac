// The Aggregate measures accuracy on 25 pairs of anonymized chess games.
// Its public results JSON separates primary accuracy from reversal consistency.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const feed = "https://theaggregate.ai/benchmarks/lichess-pairwise.json";
type Entry = { model: string; n: number; correct: number; accuracy: number; baseline_accuracy: number;
  invalid_confidence: number; consistent_reversals: number };

const board: Leaderboard = {
  benchmark: "the-aggregate-lichess-pairwise-strength-25-pairs",
  url: "https://theaggregate.ai/benchmark?slug=the-aggregate-lichess-pairwise-strength-25-pairs",
  feed,
  terms: "Credit The Aggregate when quoting scores. Bulk republication requires written permission. https://theaggregate.ai/terms robots.txt allows the feed path.",
  stats: { items:{name:'Items',unit:'count'}, correct:{name:'Correct predictions',unit:'count'}, baselineAccuracy:{name:'Baseline accuracy',unit:'%',better:'higher'}, invalidConfidence:{name:'Invalid confidence estimates',unit:'count'}, consistentReversals:{name:'Consistent reversals',unit:'count'} },
  async fetch() {
    const data = await fetchJson<{ models: Entry[]; primary_pairs: number }>(feed);
    if (data.models.length < 19) throw new Error('Incomplete Lichess standings');
    return data.models.map(r => {
      if (!r.model || !r.n || !Number.isFinite(r.accuracy) || Math.abs(r.accuracy - 100*r.correct/r.n) > 0.051) throw new Error('Invalid pairwise accuracy');
      return { model: r.model, score: r.accuracy, setting: 'Medium reasoning', metrics: { items: r.n, correct: r.correct,
        baselineAccuracy: r.baseline_accuracy, invalidConfidence: r.invalid_confidence, consistentReversals: r.consistent_reversals } };
    });
  },
};
export default board;
