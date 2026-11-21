// EOTGC scores essay relevance grading and written feedback.
// The organizers publish both track scores and their weighted total in the repository leaderboard.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const feed = "https://raw.githubusercontent.com/cubenlp/EOTGC-2025NLPCC/main/Results.md";
const board: Leaderboard = {
  benchmark: "eotgc",
  url: "https://github.com/cubenlp/EOTGC-2025NLPCC/blob/main/Results.md",
  feed,
  terms: "The organizers limit competition data to competition use and prohibit commercial use. They give no separate reuse terms for the ranking. The raw file host has no robots.txt.",
  parts: {"track1":"Track 1","track2":"Track 2"},
  async fetch() {
    const source = await fetchText(feed);
    const headers = ["Rank","System Name","Track1","Track2","Total"];
    const table = markdownTables(source).find(t => headers.every(h => t[0]?.includes(h)));
    if (!table) throw new Error('Missing results table');
    const records = table.slice(1).map(c => Object.fromEntries(table[0].map((h, i) => [h, c[i]])));
    const numeric = (s: string) => {
      const value = s?.replace(/%$/, '').trim();
      if (!value || !Number.isFinite(Number(value))) throw new Error('Invalid result: ' + s);
      return Number(value);
    };
    const rows = records.map(r => {
      const model = r["System Name"];
      if (!model) throw new Error('Missing model name');
      return { model, score: numeric(r["Total"]),
        metrics: { track1: numeric(r["Track1"]), track2: numeric(r["Track2"]) } };
    });
    if (rows.length < 9) throw new Error('Incomplete results');
    return rows;
  },
};
export default board;
