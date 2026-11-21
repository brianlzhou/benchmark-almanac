// Coding agents build a euchre bot that plays four opponents. The second-round table ranks the bots by total wins
// and reports each opponent's contribution and the cost of the run.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';

const feed = "https://fewworddotrick.com/posts/euchre-bench-take-two-more-time-more-tools-mixed-results/";

const board: Leaderboard = {
  benchmark: "euchre-bench",
  url: "https://fewworddotrick.com/posts/euchre-bench-take-two-more-time-more-tools-mixed-results/",
  feed,
  terms: "No reuse license appears on the results page. robots.txt allows the feed path.",
  costPer: 'run',
  parts: { random: 'Random', easy: 'Easy', medium: 'Medium', difficult: 'Difficult' },
  async fetch() {
    const header = ["Model", "Random", "Easy", "Medium", "Difficult", "Sum", "Cost", "Approach"];
    const table = tables(await fetchText(feed)).map(table => table.map(row => row.map(cell => cell.text))).find(t => header.every((label, i) => t[0]?.[i] === label));
    if (!table || table.length <= 8) throw new Error('Missing leaderboard columns or rows');
    return table.slice(1).map(cells => {
      const model = cells[0], score = Number(cells[5]), cost = Number(cells[6].replace('$', ''));
      const metrics: Record<string, number> = {};
      ['random', 'easy', 'medium', 'difficult'].forEach((opponent, i) => {
        if (cells[i + 1] === '—') return;
        const wins = Number(cells[i + 1]);
        if (!Number.isFinite(wins)) throw new Error('Invalid opponent wins');
        metrics[opponent] = wins;
      });
      if (!model || !Number.isFinite(cost) || score !== Object.values(metrics).reduce((a, b) => a + b, 0))
        throw new Error('Invalid euchre score');
      return { model, score, cost, metrics };
    });
  },
};
export default board;
