// The June 2024 agronomy leaderboard gives five question groups equal weight. The pinned README supplies overall accuracy, group scores, dates and license labels.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://raw.githubusercontent.com/gbstox/agronomy_llm_benchmarking/a00854fce33f303841923afb85dcebb68e439298/README.md";
const groups = ['nutrient_management','soil_and_water','pest_management','crop_management','V1_benchmark_questions'];

const board: Leaderboard = {
  benchmark: "llm-agronomy-benchmark-june-2024",
  url: "https://github.com/gbstox/agronomy_llm_benchmarking/blob/a00854fce33f303841923afb85dcebb68e439298/README.md",
  feed: FEED,
  terms: "The repository metadata lists no license. https://github.com/gbstox/agronomy_llm_benchmarking GitHub requests a one-second crawl delay.",
  aliases: { 'gpt-4o': 'gpt-4o-may-2024' },
  parts: Object.fromEntries(groups.map(g => [g,g])),
  async fetch() {
    const table = markdownTables(await fetchText(FEED)).find(t => t[0].join('|') === ['Model Name','Overall Score','Date Tested',...groups,'License Type'].join('|'));
    if (!table || table.length < 16) throw new Error('Incomplete June agronomy leaderboard');
    return table.slice(1).map(row => {
      const pct = (s: string) => {
        if (!/^\d+(?:\.\d+)?%$/.test(s)) throw new Error('Invalid agronomy percentage');
        return Number(s.slice(0,-1));
      };
      return { model: row[0], score: pct(row[1]), date: row[2], license: row[8], open: row[8] === 'Open Source',
        metrics: Object.fromEntries(groups.map((g,i) => [g,pct(row[i+3])])) };
    });
  },
};
export default board;
