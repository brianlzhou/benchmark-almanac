// QIAS Task 2 ranks Islamic knowledge systems by accuracy. The organizers embed the HTML standings inside their Google Sites page.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, text } from '../lib/html.ts';

const feed = "https://sites.google.com/view/qias2025/leaderboards";
const board: Leaderboard = {
  benchmark: 'qias-2025-islamic-knowledge-assessment',
  url: "https://sites.google.com/view/qias2025/leaderboards",
  feed,
  terms: "Google Sites permits this results path. The knowledge table ranks ten team systems. The organizers reserve all rights on the leaderboard page. https://sites.google.com/view/qias2025/leaderboards",
  async fetch() {
    const page = await fetchText(feed);
    const embedded = [...page.matchAll(/data-code="([^"]+)"/g)].filter(m => m[1].includes("Task2 Leaderboard")).flatMap(m => tables(text(m[1])));
    const table = embedded.find(t => t[0]?.[2]?.text.includes('Accuracy'));
    if (!table || table.length < 11 || !table[0][1].text.includes('Team')) throw new Error('Missing knowledge standings');
    return table.slice(1).map(c => {
      const model = c[1].text, value = c[2].text;
      if (!model || !value || !Number.isFinite(Number(value))) throw new Error('Invalid knowledge score');
      return { model, score: Number(value) * 100, submitter: model, agentOrg: c[3].text || undefined };
    });
  },
};
export default board;
