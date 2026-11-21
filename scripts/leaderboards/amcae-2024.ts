// AMCAE ranks teams on argument component classification in Chinese essays.
// The organizers publish the combined percentage score in their results Markdown table.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const feed = "https://raw.githubusercontent.com/cubenlp/NLPCC-2024-Shared-Task5/main/Result.md";
const board: Leaderboard = {
  benchmark: "amcae-2024",
  url: "https://github.com/cubenlp/NLPCC-2024-Shared-Task5/blob/main/Result.md",
  feed,
  terms: "The organizers restrict competition data to the task. The ranking gives no separate terms for score reuse. The raw file host returns 404 for robots.txt.",
  async fetch() {
    const headers = ["Rank","Team name","Score"];
    const data = markdownTables(await fetchText(feed));
    const table = data.find(t => headers.every((h, i) => t[0]?.[i] === h));
    if (!table || table.length <= 14 - 1) throw new Error('Incomplete ranking table');
    const rows = table.slice(1).map(c => {
      const model = c[1];
      const value = c[2]?.replace(/%$/, '').trim();
      if (!model || !value || !Number.isFinite(Number(value))) throw new Error('Invalid ranking row');
      return { model, submitter: model, score: Number(value) };
    });
    if (rows.length < 14) throw new Error('Missing ranked teams');
    return rows;
  },
};
export default board;
