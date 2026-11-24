// OGS-Bench scores culinary tasks. The leaderboard embeds its weighted aggregate, confidence interval and category scores in JSON.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';

const feed = "https://opengastronomy.org/benchmark/leaderboard/";
const board: Leaderboard = {
  benchmark: "ogs-bench",
  url: "https://opengastronomy.org/benchmark/leaderboard/",
  feed,
  terms: "The leaderboard dataset metadata lists Apache 2.0. The results directory links one JSON document per model. The host permits crawling.",
  parts: {
    vocabulary: { name: 'Vocabulary', group: 'Category' },
    sensory: { name: 'Sensory', group: 'Category' },
    composition: { name: 'Composition', group: 'Category' },
    pairing: { name: 'Pairing', group: 'Category' },
    explanation: { name: 'Explanation', group: 'Category' },
    risk: { name: 'Risk', group: 'Category' },
    structured_output: { name: 'Structured output', group: 'Category' },
    regional: { name: 'Regional', group: 'Category' },
    dietary: { name: 'Dietary', group: 'Category' },
    safety: { name: 'Safety', group: 'Category' },
    nutrition: { name: 'Nutrition', group: 'Category' },
    menu_engineering: { name: 'Menu engineering', group: 'Category' },
  },
  costPer: 'run',
  stats: {
    latency: { name: 'Median latency', unit: 'seconds', better: 'lower' },
    meanLatency: { name: 'Mean latency', unit: 'seconds', better: 'lower' },
    inputTokens: { name: 'Input tokens', unit: 'tokens' },
    format: { name: 'Format score', unit: '%', better: 'higher' },
    blendedPricePerMtok: { name: 'Blended price', unit: 'usd-per-mtok', better: 'lower' },
  },
  chart: {
    title: 'Intelligence vs cost',
    note: 'Aggregate score against blended price per million tokens, matching the Pareto chart on the OGS-Bench leaderboard.',
    x: { key: 'blendedPricePerMtok', label: 'Blended price per 1M tokens', unit: '$', better: 'lower', log: true },
    y: { key: 'score', label: 'Aggregate score', unit: '%', better: 'higher' },
  },
  async fetch() {
    const html = await fetchText(feed);
    const match = html.match(/<script[^>]*id="lb-data"[^>]*>([\s\S]*?)<\/script>/);
    if (!match) throw new Error('Missing OGS-Bench board data');
    const data = JSON.parse(match[1]);
    const rows = data.models.filter((m: {id:string}) => m.id !== 'baseline').map((m: {
      id: string; run_at: string; agg: { score:number; lo:number; hi:number }; cats: Record<string,{mean:number}>;
      fmt: number; pricing?: { blended?: number | null }; repro: {config_samples:number; config_closed_book:boolean}; metrics: {lat_med:number; lat_mean:number; in_tok:number; out_tok:number; usd_total:number|null}
    }) => {
      const metrics: Record<string,number> = { latency: m.metrics.lat_med / 1000, meanLatency: m.metrics.lat_mean / 1000, inputTokens: m.metrics.in_tok, format: m.fmt };
      if (typeof m.pricing?.blended === 'number' && Number.isFinite(m.pricing.blended)) metrics.blendedPricePerMtok = m.pricing.blended;
      for (const key of data.categories.all) {
        if (!Number.isFinite(m.cats[key]?.mean)) throw new Error('Missing OGS category ' + key);
        metrics[key] = 100 * m.cats[key].mean;
      }
      if (!m.id || ![m.agg.score,m.agg.lo,m.agg.hi].every(Number.isFinite)) throw new Error('Missing OGS aggregate');
      return { model: m.id, score: m.agg.score, low: m.agg.lo, high: m.agg.hi, date: m.run_at.slice(0,10), metrics,
        cost: m.metrics.usd_total ?? undefined, tokens: m.metrics.out_tok, trials: m.repro.config_samples,
        setting: m.repro.config_closed_book ? 'Closed book' : 'Open book', link: new URL('/results/'+m.id.toLowerCase()+'.json',feed).href };
    });
    if (rows.length < 20) throw new Error('Missing OGS models');
    return rows;
  },
};
export default board;
