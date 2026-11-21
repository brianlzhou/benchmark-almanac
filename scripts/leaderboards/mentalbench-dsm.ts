// MentalBench scores exact diagnostic agreement across four types of synthetic case.
// The project page supplies a weighted overall accuracy and the accuracy for each case type.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';

const feed = "https://kaist-mlplab.github.io/mentalbench/";

const board: Leaderboard = {
  benchmark: "mentalbench-dsm",
  url: "https://kaist-mlplab.github.io/mentalbench/",
  feed,
  terms: "The authors release the dataset under CC BY 4.0. The site credits CC BY-SA 4.0 for its page template. robots.txt allows the feed path.",
  parts: { type1: 'Type 1', type2: 'Type 2', type3: 'Type 3', type4: 'Type 4' },
  async fetch() {
    const header = ["Model", "Type 1", "Type 2", "Type 3", "Type 4", "Overall"];
    const table = tables(await fetchText(feed)).map(table => table.map(row => row.map(cell => cell.text))).find(t => header.every((label, i) => t[0]?.[i] === label));
    if (!table || table.length <= 22) throw new Error('Missing leaderboard columns or rows');
    return table.slice(1).map(cells => {
      const values = cells.slice(1).map(Number);
      if (values.length !== 5 || cells.some(v => !v.trim()) || !values.every(Number.isFinite)) throw new Error('Invalid diagnostic accuracy');
      const [type1, type2, type3, type4, score] = values;
      return { model: cells[0], score, metrics: { type1, type2, type3, type4 } };
    });
  },
};
export default board;
