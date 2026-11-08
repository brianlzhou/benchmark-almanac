// mu-bench (Sierra). research.sierra.ai/mubench is a Vite app (GitHub Pages) whose results ship in a data
// chunk: a literal array with, per speech-to-text system, the provider, a date and per-locale and overall
// word error rate, "significant" error rate and latency. The board ranks by Utterance Error Rate, the share
// of utterances with at least one meaning-changing error (overall significantWer), shown as a percent; that
// is the score (lower is better). The chunk names are hashed, so the page leads to the main script and the
// main script to the data chunk; the literal is read as data, never run. When one model is hosted by several
// providers, the provider is passed as the harness. The table's Latency (p95) column, the 95th-percentile
// time to a complete transcript (overall.completeP95Ms), is kept in seconds as metrics "latencyP95".
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsLiteral } from '../lib/html.ts';

const PAGE = 'https://research.sierra.ai/mubench/';

interface Entry {
  model: string;
  organization?: string;
  modelDate?: string;
  localeResults?: Record<string, Record<string,number|null>>;
  latencyMeta?: {protocol?:string;region?:string};
  overall?: { significantWer?: number; completeP95Ms?: number | null };
}

const board: Leaderboard = {
  benchmark: 'mu-bench',
  url: PAGE,
  feed: `${PAGE}assets/data-*.js (overall significantWer)`,
  terms: 'Static app data on GitHub Pages (no robots.txt rules); the μ-bench dataset is CC BY-NC 4.0 and the site states no other terms.',
  async fetch() {
    const html = await fetchText(PAGE);
    const main = html.match(/src="(\/mubench\/assets\/main-[\w-]+\.js)"/)?.[1];
    if (!main) throw new Error('no main script on the mu-bench page');
    await new Promise(r=>setTimeout(r,1100));
    const js = await fetchText(new URL(main, PAGE).href);
    const chunk = js.match(/data-[\w-]+\.js/)?.[0];
    if (!chunk) throw new Error('no data chunk named in the main script');
    // the literal writes fractions as ".0417"; JSON needs the leading zero
    await new Promise(r=>setTimeout(r,1100));
    const data = (await fetchText(`${PAGE}assets/${chunk}`)).replace(/([:[,]\s*)(-?)\.(\d)/g, '$10$2.$3');
    const at = data.search(/=\[\{id:"/);
    if (at < 0) throw new Error('no results array in the data chunk');
    const list = jsLiteral<Entry[]>(data, at + 1);
    const count = new Map<string, number>();
    for (const e of list) count.set(e.model, (count.get(e.model) ?? 0) + 1);
    const rows: LeaderboardRow[] = [];
    for (const e of list) {
      for (const [locale, stats] of Object.entries({Overall:e.overall})) {
        const uer=stats?.significantWer;if(typeof uer!=='number')continue;
        const metrics:Record<string,number>={};for(const [k,v] of Object.entries(stats??{}))if(typeof v==='number')metrics[k.endsWith('Ms')?k.slice(0,-2)+'Seconds':k]=k.endsWith('Ms')?v/1000:k.toLowerCase().includes('wer')?v*100:v;
        if(typeof stats?.completeP95Ms==='number')metrics.latencyP95=stats.completeP95Ms/1000;
        for (const [lang, value] of Object.entries(e.localeResults ?? {})) {
          if (typeof value.significantWer === 'number') metrics[lang] = value.significantWer * 100;
        }
        rows.push({model:e.model,score:Number((uer*100).toFixed(2)),harness:e.organization,date:e.modelDate,setting:[e.latencyMeta?.protocol,e.latencyMeta?.region].filter(Boolean).join('; '),metrics});
      }
    }
    return rows;
  },
};
export default board;
