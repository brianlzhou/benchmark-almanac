// Lech Mazur ranks debaters by Bradley-Terry rating across side-swapped matchups. The README contains the historical standings and measured mean debate costs.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://raw.githubusercontent.com/lechmazur/debate/HEAD/README.md";

const board: Leaderboard = {
  benchmark: "debate-lech-mazur",
  url: "https://github.com/lechmazur/debate",
  feed: FEED,
  terms: "The publisher displays results at https://github.com/lechmazur/debate. I could not verify reuse terms. GitHub requests a one-second crawl delay.",
  async fetch() {
    const all = markdownTables(await fetchText(FEED));
    const rank = all.find(t => t[0].join('|') === 'Rank|Model|BT|Matchups');
    const costTable = all.find(t => t[0].includes('Average cost per debate'));
    if (!rank || rank.length < 70 || !costTable) throw new Error('Missing debate standings');
    const costs = new Map(costTable.slice(1).map(r => [r[0], Number(r[2].replace('$',''))]));
    return rank.slice(1).map(([, label, rating, count]) => {
      const effort = label.match(/ \(([^()]+)\)$/);
      if (!label || !rating || !Number.isFinite(Number(rating)) || !Number.isFinite(Number(count))) throw new Error('Invalid debate score');
      return { model: effort ? label.slice(0, -effort[0].length) : label, setting: effort?.[1], score: Number(rating), cost: costs.get(label), metrics: { matchups: Number(count) } };
    });
  },
};
export default board;
