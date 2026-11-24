// Read macro success, its Wilson interval, full evaluation cost and pass rates for five equal-sized slices.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';
const URL = "https://research.composite.com/composite-bench";
const board: Leaderboard = {
  benchmark: "composite-bench", url: URL, feed: URL,
  costPer: 'run',
  terms: "Public maker results, robots.txt allows all agents; no additional reading restrictions stated.",
  parts: {
    steward7d: { name: 'steward_7d', group: 'Slice' },
    rulebook7d: { name: 'rulebook_7d', group: 'Slice' },
    dedup: { name: 'dedup', group: 'Slice' },
    orienteering: { name: 'orienteering', group: 'Slice' },
    gauntlet7g: { name: 'gauntlet_7g', group: 'Slice' },
  },
  stats: { meanReward: { name: 'Mean reward', unit: 'score', better: 'higher' }, nppLadder: { name: 'NPP ladder score', unit: 'score', better: 'higher' } },
  chart: {
    title: 'Macro success vs. evaluation cost',
    x: { key: 'cost', label: 'Total evaluation cost', unit: '$', better: 'lower', log: true },
    y: { key: 'score', label: 'Macro success', unit: '%', better: 'higher' },
    note: 'Composite plots macro success rate against total evaluation cost on a log scale.',
  },
  async fetch() {
    const all = tables(await fetchText(URL)).map(t => t.map(r => r.map(c => c.text)));
    const table = all.find(t => t[0]?.some(c => c.includes("Macro success")));
    if (!table) throw new Error('Overall table missing');
    const split = all.find(t=>t[0]?.includes('steward_7d'));
    const keys = (split?.[0].slice(1) ?? []).map(name=>name.replace(/_(.)/g,(_,c:string)=>c.toUpperCase()));
    const out: LeaderboardRow[] = [];
    for (const cells of table.slice(1)) {
      const score = num(cells[2]);
      if (score === undefined || !cells[1]) continue;
      const metrics: Record<string, number> = {};
      for (const [column, key] of [[4, "meanReward"], [5, "nppLadder"]] as [number, string][]) {
        const value = num(cells[column]);
        if (value !== undefined) metrics[key] = value;
      }
      const row=split?.find(r=>r[0]===cells[1]);
      if (row) keys.forEach((key,i)=>{const successes=num(row[i+1]); if(successes!==undefined) metrics[key]=100*successes/20;});
      const interval=cells[3]?.match(/\[([\d.]+),\s*([\d.]+)\]/);
      const cost=num(cells[6]?.replaceAll(',',''));
      out.push({ model:cells[1], score, cost, setting:'Maximum reasoning effort',trials:1,
        low:interval ? Number(interval[1]) : undefined, high:interval ? Number(interval[2]) : undefined, metrics });
    }
    if (out.length < 3) throw new Error(`Only ${out.length} model rows`);
    return out;
  },
};
export default board;
