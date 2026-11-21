// Proof News fact-checked English and Spanish answers to the same Arizona voter questions.
// The response file gives the inaccurate flag for every answer, including the language behind each chart bar.
import type { Leaderboard } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const feed = "https://raw.githubusercontent.com/ProofNews/aidp/main/data/Spanish_English_Arizona_Election_Queries%20-%20arizona.csv";
const board: Leaderboard = {
  benchmark: "proof-news-arizona-bilingual-voter-questions",
  url: "https://datawrapper.dwcdn.net/e89q8/4/",
  feed,
  terms: "Proof News lists CC BY-NC-ND 4.0 for the article. I found no separate license for the chart data. The chart host permits this chart in robots.txt. The raw file host has no robots.txt.",
  parts: { english: 'English', spanish: 'Spanish' },
  async fetch() {
    const counts = new Map<string, { totals: number[]; inaccurate: number[] }>();
    for (const r of parseCsv(await fetchText(feed))) {
      if (!r.model || !['0', '1'].includes(r.spanish) || !['0', '1'].includes(r.inaccurate)) throw new Error('Invalid fact-check row');
      const c = counts.get(r.model) ?? { totals: [0, 0], inaccurate: [0, 0] };
      c.totals[Number(r.spanish)]++;
      c.inaccurate[Number(r.spanish)] += Number(r.inaccurate);
      counts.set(r.model, c);
    }
    if (counts.size < 5) throw new Error('Missing models');
    return [...counts].map(([model, c]) => {
      if (c.totals.some(n => n < 25)) throw new Error('Missing fact checks for ' + model);
      return { model, score: 100 * (c.inaccurate[0] + c.inaccurate[1]) / (c.totals[0] + c.totals[1]),
        metrics: { english: 100 * c.inaccurate[0] / c.totals[0], spanish: 100 * c.inaccurate[1] / c.totals[1] } };
    });
  },
};
export default board;
