// RExBench tests whether agents can implement a research extension across 12 projects.
// The importer reads the authors' HTML results table and ranks by Final success.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';

const feed = "https://rexbench.com/";
const board: Leaderboard = {
  benchmark: "rexbench", url: "https://rexbench.com/", feed,
  terms: "The project page releases the data under MIT and Apache 2.0.",
  stats: {
    executionSuccess: { name: 'Execution success', unit: '%', better: 'higher' },
    fileRecall: { name: 'File recall', unit: '%', better: 'higher' },
  },
  aliases: {"claude_4.5_opus": "claude-opus-4-5", "claude_4_sonnet": "claude-sonnet-4", "claude_3.7_sonnet": "claude-3-7-sonnet", "gpt5": "gpt-5"},
  async fetch() {
    const source = await fetchText(feed);
    const all = tables(source).map(t => t.map(row => row.map(c => c.text)));
    const table = all.find(t => t[0]?.join('|') === "Submission|Final success|Execution success|File recall");
    if (!table) throw new Error('Results columns changed');
    const rows: LeaderboardRow[] = [];
    for (const cells of table.slice(1)) {
      const model = cells[0];
      const number = (i: number) => {
        const raw = cells[i]?.trim().replace(/%$/, '');
        if (!raw || !Number.isFinite(Number(raw))) throw new Error(`Invalid score for ${model}`);
        return Number(raw);
      };
      const run = model.match(/^rexbench-([^-]+)-(.+)-(run\d+)$/);
      if (!run) throw new Error('Unrecognized RExBench submission');
      rows.push({ model: run[2], score: number(1) * 100, harness: run[1], setting: run[3], metrics: { executionSuccess: number(2) * 100, fileRecall: number(3) * 100 } });
    }
    if (rows.length < 70) throw new Error('Expected at least 70 published results');
    return rows;
  },
};
export default board;
