// The Washington Post measures the percentage of voter guides naming the correct House district. Its Datawrapper chart publishes all three response shares.
import type { Leaderboard } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';


const feed = "https://datawrapper.dwcdn.net/asTAD/14/dataset.csv";
const board: Leaderboard = {
  benchmark: 'washington-post-midterm-voter-guides-2026',
  url: "https://datawrapper.dwcdn.net/asTAD/14/",
  feed,
  terms: "Datawrapper permits this chart path. The Washington Post publishes the chart under its terms of service. I found no open data license for the chart. https://www.washingtonpost.com/terms-of-service/",
  async fetch() {
    const source = await fetchText(feed);
    const records = parseCsv(source);
    const headers = ["Platform", "Right", "Didn't say", "Wrong"];
    const table = [records.length ? [Object.keys(records[0]), ...records.map(Object.values)] : []].find(t => headers.every(h => t[0]?.includes(h)));
    if (!table) throw new Error('Missing results table columns');
    const [head, ...body] = table;
    const rows = [];
    for (const cells of body) {
      const cell = (name: string) => cells[head.indexOf(name)]?.trim();
      const model = cell("Platform");
      const number = (column: string) => {
        const value = cell(column)?.replace(/%$/, '');
        if (!value || !Number.isFinite(Number(value))) throw new Error('Invalid ' + column + ' for ' + model);
        return Number(value);
      };
      if (!model) throw new Error('Missing model name');
      rows.push({ model, score: number("Right"), metrics: { unspecified: number("Didn't say"), wrong: number("Wrong") } });
    }
    if (rows.length < 6) throw new Error('Expected at least 6 results');
    return rows;
  },
};
export default board;
