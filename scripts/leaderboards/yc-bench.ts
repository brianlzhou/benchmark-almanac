// YC-Bench: average simulated net worth in US dollars, not API cost. Read the live leaderboard
// and its chart of monthly funds, open weights, bankruptcies and run counts. Keep the Greedy Bot baseline as a named system.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson, fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';

const FEED = "https://collinear-ai.github.io/yc-bench/";
const board: Leaderboard = {
 benchmark: "yc-bench", url: "https://collinear-ai.github.io/yc-bench/", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',

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
      if (counts) Object.assign(metrics, { bankruptRuns: Number(counts[1]), runs: Number(counts[2]) });
      for (const [month, funds] of Object.entries(id ? chart[id] ?? {} : {})) {
        if (/^\d{4}-\d{2}$/.test(month) && Number.isFinite(funds)) metrics['funds:' + month] = funds;
      }
      const rank = num(r[0]?.text);
      if (rank !== undefined) metrics.rank = rank;
      rows.push({ model, score, trials: counts ? Number(counts[2]) : undefined, metrics,
        open: weightList && id && id !== 'greedy_bot' ? open.has(id) : undefined });
    }
    return rows;
 },
};
export default board;
