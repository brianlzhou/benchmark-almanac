// DrafterBench scores drawing revisions made with tools. The README leaderboard reports three-run means and variances, with Comprehensive rewards as the overall measure.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://raw.githubusercontent.com/Eason-Li-AIS/DrafterBench/DrafterBench/README.md";

const board: Leaderboard = {
  benchmark: "drafterbench",
  url: "https://github.com/Eason-Li-AIS/DrafterBench#leaderboard",
  feed: FEED,
  terms: "The repository includes the leaderboard in its README and carries the MIT license. https://github.com/Eason-Li-AIS/DrafterBench GitHub requests a one-second crawl delay.",
  async fetch() {
    const table = markdownTables(await fetchText(FEED)).find((t) => t[0][0] === 'Metric');
    if (!table || table[0].length < 20 || !table.some(([key]) => key === 'Comprehensive rewards')) throw new Error('Incomplete DrafterBench table');
    const parts: Record<string, string> = {};
    const rows = table[0].slice(1).map((name, i) => {
      const model = name.replace(/ \(Mean\/Var\)$/, '');
      const metrics: Record<string, number> = {};
      for (const r of table.slice(1)) {
        const pair = r[i + 1]?.match(/^(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/);
        if (!pair) throw new Error(`Missing mean and variance for ${model}: ${r[0]}`);
        metrics[r[0]] = Number(pair[1]);
        metrics[r[0] + ' variance'] = Number(pair[2]);
        if (!['Comprehensive rewards', 'Average tasks'].includes(r[0])) parts[r[0]] = r[0];
      }
      return { model, score: metrics['Comprehensive rewards'], trials: 3, metrics };
    });
    board.parts = parts;
    return rows;
  },
};
export default board;
