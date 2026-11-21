// SolveEdit evaluates visual problem solving by image and video generators. The project page ranks direct generations by SolveScore.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';

const FEED = "https://wenjieshu.github.io/SolveEdit-project-page/#leaderboard";

const board: Leaderboard = {
  benchmark: "solveedit",
  url: "https://wenjieshu.github.io/SolveEdit-project-page/#leaderboard",
  feed: FEED,
  terms: "The authors do not specify separate terms for leaderboard scores on https://wenjieshu.github.io/SolveEdit-project-page/#leaderboard",
  async fetch() {
    const table = tables(await fetchText(FEED)).find(t => t[0].map(c => c.text).join('|') === 'Rank|Model|Type|Required R ↑|Damage D ↓|SolveScore ↑');
    if (!table || table.length < 12) throw new Error('Missing SolveEdit scores');
    return table.slice(1).map(cells => {
      const [, model, type, required, damage, score] = cells.map(c => c.text);
      if (![required, damage, score].every(v => v && Number.isFinite(Number(v)))) throw new Error('Missing SolveEdit metric');
      return { model, score: Number(score), open: type.toLowerCase().includes('open') ? true : type.toLowerCase().includes('commercial') ? false : undefined,
        metrics: { required: Number(required), damage: Number(damage) } };
    });
  },
};
export default board;
