// Exa ATLAS compares search APIs on 547 table-building tasks. Row F1 rewards correct, complete rows.
// The evaluation page loads a JavaScript data file with F1 fractions and dollars per task.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const feed = "https://exa.ai/evals";

const board: Leaderboard = {
  benchmark: "exa-atlas",
  url: "https://exa.ai/evals",
  feed,
  terms: "Exa publishes its own evaluation. Its robots.txt allows AI input on public pages. The evaluation page gives no separate results license.",
  async fetch() {
    const html = await fetchText(feed);
    const chart = html.match(/<section id="atlas"[\s\S]*?<\/section>/)?.[0];
    if (!chart) throw new Error('Missing Exa ATLAS section');
    const chunks = [...html.matchAll(/<script[^>]+src="(\/_next\/static\/chunks\/\d+-[^"]+\.js)"/g)].map(m => m[1]);
    chunks.sort((a,b) => Number(b.includes('/4741-')) - Number(a.includes('/4741-')));
    for (const path of new Set(chunks)) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const js = await fetchText(new URL(path, feed).href);
      const data = js.match(/=(\.?\d+(?:\.\d+)?),\w+=\[(\{provider:"[^"]+",label:"[^"]+",costPerTask:[\d.]+,rowF1:[\d.]+\}[^\]]*)\]/);
      if (!data) continue;
      const margin = Number(data[1]) * 100;
      const entries = data[2].split(/\},\{/);
      return entries.map(entry => {
        const m = entry.match(/provider:"[^"]+",label:"([^"]+)",costPerTask:([\d.]+),rowF1:([\d.]+)/);
        if (!m || entries.length < 11 || !chart.includes(m[1])) throw new Error('Exa ATLAS chart and data disagree');
        const score = Number(m[3]) * 100;
        return { model: m[1], score, cost: Number(m[2]), low: score - margin, high: score + margin };
      });
    }
    throw new Error('Missing Exa ATLAS chart data');
  },
};

export default board;
