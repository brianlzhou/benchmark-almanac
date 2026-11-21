// CACAE scores argument components and relations in Chinese essays.
// The organizers publish the weighted total and both track scores in their final results.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const feed = "https://raw.githubusercontent.com/cubenlp/NLPCC-2025-Shared-Task3/main/Results.md";
const board: Leaderboard = {
  benchmark: "cacae-2025",
  url: "https://github.com/cubenlp/NLPCC-2025-Shared-Task3/blob/main/Results.md",
  feed,
  terms: "The organizers restrict competition data to the task. The ranking gives no separate terms for score reuse. The raw file host has no robots.txt.",
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
    if (rows.length < 6) throw new Error('Incomplete results');
    return rows;
  },
};
export default board;
