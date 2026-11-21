// okraPDF tests field extraction from 25 bills of lading. The article's leaderboard ranks parsers by overall field accuracy.
// The remaining columns give accuracy for each document condition.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';

const feed = "https://okrapdf.com/blog/bill-of-lading-ocr-benchmark/";

const board: Leaderboard = {
  benchmark: "bol-bench-okrapdf",
  url: "https://okrapdf.com/blog/bill-of-lading-ocr-benchmark/",
  feed,
  terms: "The methodology names Apache 2.0 for the dataset. The article gives no separate license for its results table. robots.txt allows the feed path.",
  parts: { digital: 'Digital', scan: 'Scan', fax: 'Fax-hard' },
  async fetch() {
    const header = ["#", "Parser", "Class", "Overall", "Digital", "Scan", "Fax-hard"];
    const table = tables(await fetchText(feed)).map(table => table.map(row => row.map(cell => cell.text))).find(t => header.every((label, i) => t[0]?.[i] === label));
    if (!table || table.length <= 24) throw new Error('Missing leaderboard columns or rows');
    return table.slice(1).map(cells => {
      const scores = cells.slice(3);
      if (scores.length !== 4 || scores.some(v => !/^\d+(?:\.\d+)?%$/.test(v))) throw new Error('Invalid parser score');
      const [score, digital, scan, fax] = scores.map(parseFloat);
      return { model: cells[1].replace('( /', '(/'), score, metrics: { digital, scan, fax } };
    });
  },
};
export default board;
