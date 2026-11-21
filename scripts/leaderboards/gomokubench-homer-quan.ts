// GomokuBench scores games against a search engine, rewarding wins and survival time.
// The repository leaderboard reports the score, outcomes and average move counts.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const feed = "https://raw.githubusercontent.com/homerquan/GomokuBench/main/README.md";

const board: Leaderboard = {
 stats: {
  losses: { name: 'Losses', unit: 'count', better: 'lower' },
  lossMoves: { name: 'Moves in losses', unit: 'count', better: 'lower' },
 },
  benchmark: "gomokubench-homer-quan",
  url: "https://github.com/homerquan/GomokuBench#current-leaderboard",
  feed,
  terms: "The repository includes an Apache 2.0 license. The PyPI listing declares MIT. The host has no robots.txt.",
  async fetch() {
    const header = ["Model", "Wins", "Losses", "Draws", "Avg Moves (Win)", "Avg Moves (Loss)", "Score"];
    const table = markdownTables(await fetchText(feed)).find(t => header.every((label, i) => t[0]?.[i] === label));
    if (!table || table.length <= 12) throw new Error('Missing leaderboard columns or rows');
    return table.slice(1).map(cells => {
      const [wins, losses, draws, winMoves, lossMoves, score] = cells.slice(1).map(Number);
      if (cells.length !== 7 || cells.some(v => !v) || ![wins, losses, draws, winMoves, lossMoves, score].every(Number.isFinite))
        throw new Error('Missing Gomoku result');
      const label = cells[0].match(/^(.+?) \(([^)]+)\)$/);
      return { model: label?.[1] ?? cells[0], setting: label?.[2], score, trials: wins + losses + draws,
        metrics: { wins, losses, draws, winMoves, lossMoves } };
    });
  },
};
export default board;
