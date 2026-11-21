// MAWARITH ranks inheritance systems by MIR-E. The organizers embed the HTML standings inside their Google Sites page.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, text } from '../lib/html.ts';

const feed = "https://sites.google.com/view/qias2026/leaderboards";
const board: Leaderboard = {
  benchmark: 'mawarith',
  url: "https://sites.google.com/view/qias2026/leaderboards",
  feed,
  terms: "Google Sites permits this results path. The inheritance table ranks 8 team systems. The organizers reserve all rights on the leaderboard page. https://sites.google.com/view/qias2026/leaderboards",
  async fetch() {
    const page = await fetchText(feed);
    const embedded = [...page.matchAll(/data-code="([^"]+)"/g)].flatMap(m => tables(text(m[1])));
    const table = embedded.find(t => t[0]?.[2]?.text.includes('MIR-E'));
    if (!table || table.length < 9 || !table[0][1].text.includes('Team')) throw new Error('Missing inheritance standings');
    return table.slice(1).map(c => {
      const model = c[1].text, value = c[2].text;
      if (!model || !value || !Number.isFinite(Number(value))) throw new Error('Invalid inheritance score');
      return { model, score: Number(value), submitter: c[3].text };
    });
  },
};
export default board;
