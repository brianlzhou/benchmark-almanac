// OGS-Bench scores culinary tasks. The leaderboard embeds its weighted aggregate, confidence interval and category scores in JSON.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';

const feed = "https://opengastronomy.org/benchmark/leaderboard/";
const board: Leaderboard = {
  benchmark: "ogs-bench",
  url: "https://opengastronomy.org/benchmark/leaderboard/",
  feed,
  terms: "The leaderboard dataset metadata lists Apache 2.0. The results directory links one JSON document per model. The host permits crawling.",
  parts: {}, costPer: 'run',
  stats: {
    latency: { name: 'Median latency', unit: 'seconds', better: 'lower' },
    meanLatency: { name: 'Mean latency', unit: 'seconds', better: 'lower' },
    inputTokens: { name: 'Input tokens', unit: 'tokens' },
    format: { name: 'Format score', unit: '%', better: 'higher' },
    vocabulary: { name: 'Vocabulary score', unit: '%', better: 'higher' },
    sensory: { name: 'Sensory score', unit: '%', better: 'higher' },
    composition: { name: 'Composition score', unit: '%', better: 'higher' },
    pairing: { name: 'Pairing score', unit: '%', better: 'higher' },
    explanation: { name: 'Explanation score', unit: '%', better: 'higher' },
    risk: { name: 'Risk score', unit: '%', better: 'higher' },
    structured_output: { name: 'Structured output score', unit: '%', better: 'higher' },
    regional: { name: 'Regional score', unit: '%', better: 'higher' },
    dietary: { name: 'Dietary score', unit: '%', better: 'higher' },
    safety: { name: 'Safety score', unit: '%', better: 'higher' },
    nutrition: { name: 'Nutrition score', unit: '%', better: 'higher' },
    menu_engineering: { name: 'Menu engineering score', unit: '%', better: 'higher' },
  },
  async fetch() {
    const html = await fetchText(feed);
    const match = html.match(/<script[^>]*id="lb-data"[^>]*>([\s\S]*?)<\/script>/);
    if (!match) throw new Error('Missing OGS-Bench board data');
    const data = JSON.parse(match[1]);
    const rows = data.models.filter((m: {id:string}) => m.id !== 'baseline').map((m: {
      id: string; run_at: string; agg: { score:number; lo:number; hi:number }; cats: Record<string,{mean:number}>;
      fmt: number; repro: {config_samples:number; config_closed_book:boolean}; metrics: {lat_med:number; lat_mean:number; in_tok:number; out_tok:number; usd_total:number|null}
    }) => {
      const metrics: Record<string,number> = { latency: m.metrics.lat_med / 1000, meanLatency: m.metrics.lat_mean / 1000, inputTokens: m.metrics.in_tok, format: m.fmt };
      for (const key of data.categories.all) {
        if (!Number.isFinite(m.cats[key]?.mean)) throw new Error('Missing OGS category ' + key);
        board.parts![key] = key.replaceAll('_',' ');
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
