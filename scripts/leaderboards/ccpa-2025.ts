// The CCL 2025 awards table ranks Chinese poetry appreciation submissions on their final score.
// It lists the three prize winners and both component scores.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';

const feed = "https://cips-cl.org/static/CCL2025/en/cclEval/evalResults/index.html#task5";
const board: Leaderboard = {
  benchmark: "ccpa-2025",
  url: "https://cips-cl.org/static/CCL2025/en/cclEval/evalResults/index.html#task5",
  feed,
  terms: "The conference publishes the results without separate score terms. Its robots.txt allows reference use and disallows AI training.",
  parts: {"taskA":"Poetic Text Understanding","taskB":"Emotional Appreciation of Poetry"},
  async fetch() {
    const source = await fetchText(feed);
    const headers = ["Affiliation","Team Member","Final Score","TaskA","TaskB"];
    const table = tables(source).map(t => t.map(r => r.map(c => c.text))).find(t => headers.every(h => t[0]?.includes(h)));
    if (!table) throw new Error('Missing results table');
    const records = table.slice(1).map(c => Object.fromEntries(table[0].map((h, i) => [h, c[i]])));
    const numeric = (s: string) => {
      const value = s?.replace(/%$/, '').trim();
      if (!value || !Number.isFinite(Number(value))) throw new Error('Invalid result: ' + s);
      return Number(value);
    };
    const rows = records.map(r => {
      const model = r["Affiliation"];
      if (!model) throw new Error('Missing model name');
      return { model, score: numeric(r["Final Score"]),
        metrics: { taskA: numeric(r["TaskA"]), taskB: numeric(r["TaskB"]) }, submitter: r['Team Member'] };
    });
    if (rows.length < 3) throw new Error('Incomplete results');
    return rows;
  },
};
export default board;
