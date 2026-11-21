// Steve Maughan rates chess engines that models write in 24 hours by their tournament Elo. The README reports game counts, win scores and 95% intervals.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://raw.githubusercontent.com/stevemaughan/chess-engine-benchmark/main/README.md";
const board: Leaderboard = {
  benchmark: "chess-engine-benchmark-steve-maughan",
  url: "https://github.com/stevemaughan/chess-engine-benchmark#results-so-far",
  feed: FEED,
  terms: "The repository lists no score reuse license. https://github.com/stevemaughan/chess-engine-benchmark The raw file host has no robots.txt.",
  aliases: { 'Astra 6': 'gpt-6-astra' },
  async fetch() {
    const source = await fetchText(FEED);
    const table = markdownTables(source).find(t => t[0].join('|') === 'Engine|Model|Elo|95% CI|Games|Score|Repository');
    if (!table || table.length < 10) throw new Error('Missing chess engine Elo table');
    return table.slice(1).map(([, model, elo, ci, games, result, repository]) => {
      const score = Number(elo);
      const margin = Number(ci.replace(/^±/, ''));
      const link = source.match(new RegExp('\\[' + repository + '\\]\\((https://github.com/[^)]+)\\)'))?.[1];
      if (!model || !elo || !ci.startsWith('±') || !games || !link || ![score, margin, Number(games), parseFloat(result)].every(Number.isFinite)) throw new Error('Invalid engine Elo for ' + model);
      return { model, score, low: score - margin, high: score + margin, trials: Number(games), link, metrics: { gameScore: parseFloat(result) } };
    });
  },
};
export default board;
