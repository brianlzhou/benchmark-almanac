// Minerva-Ego tests reasoning about first-person video. Table 1 reports multiple-choice accuracy.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = "https://arxiv.org/html/2605.15342";
const board: Leaderboard = {
  benchmark: "minerva-ego", static: 'paper', url: feed, feed,
  terms: 'The authors publish the paper under the license listed at https://arxiv.org/abs/2605.15342.',
  aliases: { 'Qwen-3': 'qwen3-vl-235b-a22b' },
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const t = tables.find(t => t[0]?.join('|') === 'Method|# Frames|Thinking|MCQ-Acc. %');
    if (!t) throw new Error('Missing Minerva-Ego Table 1');
    const rows = t.slice(1).filter(r => !['Human performance','Random'].includes(r[0])).map(([model, frames, thinking, value]) => {
      if (!frames || !['Yes','No'].includes(thinking)) throw new Error('Invalid frame or thinking setting');
      return {model, setting: frames + ' frames, thinking ' + thinking.toLowerCase(), score: numberCell(value)};
    });
    return checked(rows, 7);
  },
};
export default board;
