// Bug in the Code Stack measures average retrieval accuracy on long Python inputs. Hamming's HTML leaderboard reports the percentage of errors located.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const FEED = "https://hamming.ai/leaderboards/bug-in-the-codestack";
const columns = ["Provider", "Model name \u2195", "Average retrieval accuracy (%) \u2195"];

const board: Leaderboard = {
  benchmark: "bug-in-the-code-stack",
  url: "https://hamming.ai/leaderboards/bug-in-the-codestack",
  feed: FEED,
  terms: "The publisher displays results at https://hamming.ai/leaderboards/bug-in-the-codestack. I could not verify reuse terms. Hamming allows crawling in robots.txt.",
  async fetch() {
    const table = tables(await fetchText(FEED)).find((rows) =>
      columns.every((name, index) => rows[0]?.[index]?.text === name));
    if (!table) throw new Error('Missing results table or expected columns');
    const rows = table.slice(1).map((cells) => {
      const values = cells.map((cell) => cell.text);
      const numberAt = (index: number) => {
        const value = num(values[index]);
        if (value == null) throw new Error(`Missing ${columns[index]} for ${values[1]}`);
        return value;
      };
      if (!values[1]) throw new Error('Missing model name');
      return { model: values[1], score: numberAt(2) };
    });
    if (rows.length < 11) throw new Error(`Expected at least 11 rows, found ${rows.length}`);
    return rows;
  },
};
export default board;
