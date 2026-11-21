// VetEval ranks veterinary examination performance by its safety-adjusted index. The leaderboard's
// server-rendered data includes its six category scores, confidence intervals, cost, timing and verification tier.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { nextFlight } from '../lib/html.ts';
const feed = "https://veteval.ai/leaderboard";
const board: Leaderboard = {
  stats: { index_raw: { name: 'Raw safety index', unit: 'index', better: 'higher' }, harm_per_1000: { name: 'Harmful outputs per 1,000', unit: 'count', better: 'lower' }, safety_coverage: { name: 'Safety coverage', unit: 'score', better: 'higher' }, safety_gate_multiplier: { name: 'Safety gate multiplier', unit: 'score', better: 'higher' }, consistency_multiplier: { name: 'Consistency multiplier', unit: 'score', better: 'higher' }, floor_multiplier: { name: 'Floor multiplier', unit: 'score', better: 'higher' }, rating: { name: 'Rating', unit: 'rating', better: 'higher' }, latency_seconds: { name: 'Latency', unit: 'seconds', better: 'lower' }, reliability: { name: 'Reliability', unit: 'score', better: 'higher' } },
  benchmark: 'veteval',
  url: "https://veteval.ai/leaderboard",
  feed,
  terms: "VetEval robots.txt allows reading. Its terms prohibit scraping and bulk extraction and require credit, verification tier and date when citing results. https://veteval.ai/legal/terms-of-service",
  async fetch() {
    const page = nextFlight(await fetchText(feed));
    const payload = page.match(/"rows":(\[\{"model_slug":[^\n]+?\]),"activeCategory":"overall"/)?.[1];
    if (!payload) throw new Error('Missing VetEval overall board');
    const rows = JSON.parse(payload) as (Record<string, unknown> & {
      display_name: string; model_slug: string; evaluated_at: string; run_by: string; verification: string;
      index: number; ci_low: number; ci_high: number; is_open_weight: boolean; cost_per_case_usd: number | null;
      categories: {key: string; label: string; value: number; ci_low: number; ci_high: number}[];
    })[];
    if (rows.length < 29) throw new Error('Missing VetEval models');
    board.parts = {};
    return rows.map(r => {
      if (!r.display_name || !r.evaluated_at || !r.verification || ![r.index,r.ci_low,r.ci_high].every(Number.isFinite) || r.categories.length !== 6) throw new Error('Incomplete VetEval entry');
      const metrics: Record<string, number> = {};
      for (const key of ['index_raw','harm_per_1000','safety_coverage','safety_gate_multiplier','consistency_multiplier',
        'floor_multiplier','rating','latency_seconds','reliability','rank_low','rank_high']) {
        if (typeof r[key] !== 'number') throw new Error('Invalid VetEval metric ' + key);
        metrics[key === 'rank_low' ? 'rankLow' : key === 'rank_high' ? 'rankHigh' : key] = r[key];
      }
      for (const c of r.categories) {
        if (!c.label || ![c.value,c.ci_low,c.ci_high].every(Number.isFinite)) throw new Error('Missing category score');
        metrics[c.key] = c.value;
        metrics[c.key + '_low'] = c.ci_low;
        metrics[c.key + '_high'] = c.ci_high;
        board.parts![c.key] = c.label;
      }
      return { model: r.display_name, score: r.index, low: r.ci_low, high: r.ci_high, metrics, cost: r.cost_per_case_usd ?? undefined,
        setting: r.verification, date: r.evaluated_at, submitter: r.run_by, open: r.is_open_weight, link: new URL('/' + r.model_slug, feed).href };
    });
  },
};
export default board;
