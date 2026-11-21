// MIVAS ranks voice agents by the percentage of tasks passed on all five trials. The page embeds cross-industry
// results, industry and difficulty breakdowns, pass@1, latency and hourly cost.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAfter, nextFlight } from '../lib/html.ts';

const feed = "https://research.getbluejay.ai/benchmarks/mivas/leaderboard";
type Metrics = Record<string, number | null>;
type Entry = { name: string; slug: string; model: string; by_industry: Record<string, { metrics: Metrics }>; cross_industry: { metrics: Metrics; by_difficulty: Record<string, Metrics> } };

const board: Leaderboard = {
  benchmark: "mivas-bench",
  stats: { combined: { name: 'Combined score', unit: '%', better: 'higher' }, pass_at_1: { name: 'Pass@1', unit: '%', better: 'higher' }, tools: { name: 'Tool success rate', unit: '%', better: 'higher' }, handoff: { name: 'Handoff success rate', unit: '%', better: 'higher' }, hangup_db: { name: 'Hang-up quality', unit: 'score', better: 'higher' }, latency_ms: { name: 'Latency', unit: 'ms', better: 'lower' }, p90_latency_ms: { name: '90th percentile latency', unit: 'ms', better: 'lower' }, duration_s: { name: 'Duration', unit: 'seconds', better: 'lower' }, turns: { name: 'Turns', unit: 'count', better: 'lower' }, cost_per_hour_usd: { name: 'Cost per hour', unit: 'usd', better: 'lower' } },
  url: "https://research.getbluejay.ai/benchmarks/mivas/leaderboard",
  feed,
  terms: "Bluejay Labs publishes the leaderboard on its research site. No separate score license is stated. robots.txt allows the feed path.",
  async fetch() {
    const entries = jsonAfter<Entry[]>(nextFlight(await fetchText(feed)), '"environments":');
    if (entries.length < 14) throw new Error('Missing MIVAS model configurations');
    return entries.map(r => {
      const m = r.cross_industry.metrics;
      if (!r.name || !Number.isFinite(m.pass_power_5)) throw new Error('Missing MIVAS pass^5');
      const metrics: Record<string, number> = {};
      for (const [k, v] of Object.entries(m)) if (typeof v === 'number' && k !== 'pass_power_5') metrics[k] = v;
      for (const [k, v] of Object.entries(r.by_industry)) if (typeof v.metrics?.pass_power_5 === 'number') {
        metrics[k] = v.metrics.pass_power_5;
        (board.parts ??= {})[k] = { name: k, group: 'Industry' };
      }
      for (const [k, v] of Object.entries(r.cross_industry.by_difficulty)) if (typeof v.pass_power_5 === 'number') {
        metrics[k] = v.pass_power_5;
        (board.parts ??= {})[k] = { name: k, group: 'Difficulty' };
      }
      const models = r.model.split(' + ');
      return { model: r.name, models: models.length > 1 ? models : undefined, score: m.pass_power_5!, trials: 5,
        link: new URL('/benchmarks/mivas/model-harnesses/' + r.slug, feed).href, metrics };
    });
  },
};
export default board;
