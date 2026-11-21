// MedHallu tests whether models detect medical hallucinations. The project site reports overall F1
// with and without supporting knowledge, along with precision and F1 at three difficulty levels.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';
import { checked, grid } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://medhallu.github.io/';
const board: Leaderboard = {
  benchmark: 'medhallu', url: feed, feed,
  terms: 'Public results credited to the MedHallu authors at https://medhallu.github.io/.',
  parts: {easy: 'Easy F1', medium: 'Med F1', hard: 'Hard F1'},
  aliases: {'Gemma-2-2b-Instruct': 'gemma-2-2b-it'},
  async fetch() {
    const table = tables(await fetchText(feed)).map(grid).find(t => t[0]?.includes('Without Knowledge'));
    const group = ['Overall F1', 'Overall P', 'Easy F1', 'Med F1', 'Hard F1'];
    if (table?.[1]?.join('|') !== ['Model', ...group, ...group, 'Δ Knowledge'].join('|') ||
        table[0][6] !== 'With Knowledge') throw new Error('Missing MedHallu columns');
    const rows: LeaderboardRow[] = [];
    for (const [name, ...cells] of table.slice(2)) {
      if (name.startsWith('Average (')) continue;
      if (cells.length !== 11) throw new Error('Invalid MedHallu row');
      for (const [i, setting] of ['Without Knowledge', 'With Knowledge'].entries()) {
        const [score, precision, easy, medium, hard] = cells.slice(i * 5, i * 5 + 5).map(numberCell);
        rows.push({model: name.replace(/\s*\*$/, ''), setting, score, metrics: {precision, easy, medium, hard}});
      }
    }
    return checked(rows, 28);
  },
};
export default board;
