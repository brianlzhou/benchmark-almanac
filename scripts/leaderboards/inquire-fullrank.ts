// INQUIRE-Fullrank measures average precision at 50 across ecological image queries.
// The project page lists retrieval models and two-stage retrieval and reranking systems.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';

const feed = "https://inquire-benchmark.github.io/";


const board: Leaderboard = {
  benchmark: "inquire-fullrank",
  url: "https://inquire-benchmark.github.io/",
  feed,
  terms: "The evaluation repository uses MIT. The website gives no separate reuse terms for the score tables. https://github.com/inquire-benchmark/INQUIRE/blob/main/LICENSE The site serves no robots.txt rules.",
  parts: { appearance: 'Appearance', behavior: 'Behavior', context: 'Context', species: 'Species' },
  async fetch() {
    const all = tables(await fetchText(feed));
    const table = all.find(t => t.some(r => r[0]?.text.includes('Top 100 →')) && t[0].map(c=>c.text).join('|') === 'Method|Size|Overall|Appearance|Behavior|Context|Species');
    if (!table) throw new Error('Missing INQUIRE full-ranking table');
    const rows = table.slice(1).map(r => r.map(c => c.text)).filter(r => r[0] !== 'Random').map(([model,size,overall,a,b,c,s]) => {
      const score = Number(overall);
      if (![overall,a,b,c,s].every(v => v && Number.isFinite(Number(v)))) throw new Error('Incomplete result for ' + model);
      const pair = model.split(' Top 100 → ');
      return { model, models: pair.length === 2 ? pair : undefined, params: size.endsWith('M') ? parseFloat(size)/1000 : undefined,
        score, metrics: {appearance: Number(a), behavior: Number(b), context: Number(c), species: Number(s)} };
    });
    if (rows.length < 18) throw new Error('Expected 18 INQUIRE results');
    return rows;
  },
};
export default board;
