// CIBench measures interactive data analysis with a code interpreter. The authors' leaderboard CSV reports an overall average and ten stage scores.
import type { Leaderboard } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const FEED = "https://raw.githubusercontent.com/open-compass/CIBench/HEAD/docs/scores.csv";
const categories = ["E-Tool", "E-Exe", "E-Num", "E-Text", "E-Vis", "O-Tool", "O-Exe", "O-Num", "O-Text", "O-Vis"];

const board: Leaderboard = {
  benchmark: "cibench",
  url: "https://open-compass.github.io/CIBench/leaderboard.html",
  feed: FEED,
  terms: "The publisher links the board at https://open-compass.github.io/CIBench/leaderboard.html. Separate results licensing remains unverified. The site returns a 404 page for robots.txt.",
  parts: Object.fromEntries(categories.map((key) => [key, key])),
  async fetch() {
    const records = parseCsv((await fetchText(FEED)).trimStart());
    if (records.length < 24) throw new Error('Expected at least 24 results');
    return records.map((r) => {
      const number = (column: string) => {
        if (!r[column]?.trim() || !Number.isFinite(Number(r[column]))) throw new Error(`Missing ${column} for ${r["Model"]}`);
        return Number(r[column]);
      };
      const model = r["Model"];
      if (!model) throw new Error('Missing model name');
      return { model, score: number("Avg"), metrics: Object.fromEntries(categories.map((key) => [key, number(key)])), open: r["opensourced"] === 'TRUE' };
    });
  },
};
export default board;
