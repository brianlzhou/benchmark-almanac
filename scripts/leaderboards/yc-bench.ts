// YC-Bench: average simulated net worth in US dollars, not API cost. Read the live leaderboard
// and its chart of monthly funds, open weights, bankruptcies and run counts. Keep the Greedy Bot baseline as a named system.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson, fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';

const FEED = "https://collinear-ai.github.io/yc-bench/";
const board: Leaderboard = {
 benchmark: "yc-bench", url: "https://collinear-ai.github.io/yc-bench/", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',
 stats: {
   bankruptRuns: {name: 'Bankrupt runs', unit: 'count', better: 'lower'},
   'funds:2025-01': {name: 'Funds in January 2025', unit: 'usd'},
   'funds:2025-02': {name: 'Funds in February 2025', unit: 'usd'},
   'funds:2025-03': {name: 'Funds in March 2025', unit: 'usd'},
   'funds:2025-04': {name: 'Funds in April 2025', unit: 'usd'},
   'funds:2025-05': {name: 'Funds in May 2025', unit: 'usd'},
   'funds:2025-06': {name: 'Funds in June 2025', unit: 'usd'},
   'funds:2025-07': {name: 'Funds in July 2025', unit: 'usd'},
   'funds:2025-08': {name: 'Funds in August 2025', unit: 'usd'},
   'funds:2025-09': {name: 'Funds in September 2025', unit: 'usd'},
   'funds:2025-10': {name: 'Funds in October 2025', unit: 'usd'},
   'funds:2025-11': {name: 'Funds in November 2025', unit: 'usd'},
   'funds:2025-12': {name: 'Funds in December 2025', unit: 'usd'},
 },

 async fetch() {

    const html = await fetchText(FEED);
    const table = tables(html).find(t => t[0]?.[2]?.text === 'Net Worth');
    if (!table) throw new Error('YC-Bench table missing');
    const ids = new Map([...html.matchAll(/'([^']+)':\s*\{\s*name: '([^']+)'/g)].map(m => [m[2], m[1]]));
    const weightList = html.match(/const OPEN_SOURCE = new Set\(\[([^\]]*)/);
    const open = new Set([...((weightList?.[1] ?? '').matchAll(/'([^']+)'/g))].map(m => m[1]));
    const chart = await fetchJson<Record<string, Record<string, number>>>(new URL('static/data.json', FEED).href);
    const rows: LeaderboardRow[] = [];
    for (const r of table.slice(1)) {
      const model = text(r[1]?.html.match(/class="model-name"[^>]*>([\s\S]*?)<\/span>/)?.[1] ?? r[1]?.html ?? '');
      const score = num(r[2]?.text);
      if (!model || score === undefined) continue;
      const id = ids.get(model);
      const counts = r[3].text.match(/(\d+)\/(\d+)/);
      const metrics: Record<string, number> = {};
      if (counts) metrics.bankruptRuns = Number(counts[1]);
      for (const [month, funds] of Object.entries(id ? chart[id] ?? {} : {})) {
        if (/^\d{4}-\d{2}$/.test(month) && Number.isFinite(funds)) metrics['funds:' + month] = funds;
      }
      rows.push({ model, score, trials: counts ? Number(counts[2]) : undefined, metrics,
        open: weightList && id && id !== 'greedy_bot' ? open.has(id) : undefined });
    }
    return rows;
 },
};
export default board;
