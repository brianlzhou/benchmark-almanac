// K12Vista tests Chinese school subjects using questions with images or captions.
// Table 7 reports average accuracy across all questions for direct and step-by-step prompts.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { PAPER_TERMS, numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://arxiv.org/html/2506.01676';
const board: Leaderboard = {
  benchmark: 'k12vista', static: 'paper', url, feed: url, terms: PAPER_TERMS,
  aliases: {
    'Qwen2-VL-72B': 'qwen2-vl-72b-instruct', 'InternVL2-76B': 'internvl2-llama3-76b',
    'InternVL2.5-MPO-78B': 'internvl2-5-78b-mpo', 'InternVL2.5-MPO-38B': 'internvl2-5-38b-mpo',
    'InternVL2.5-MPO-26B': 'internvl2-5-26b-mpo', 'InternVL2.5-MPO-8B': 'internvl2-5-8b-mpo',
    'InternVL2.5-MPO-4B': 'internvl2-5-4b-mpo',
  },
  parts: { primary: 'Primary', middle: 'Middle', high: 'High' },
  async fetch() {
    const table = paperTables(await paperHtml(url)).map(grid).findLast(t =>
      t[0]?.[1] === 'Direct Inference Score' && t[0][5] === 'Step-by-Step Score');
    if (table?.[1].join('|') !== 'Model|Primary|Middle|High|Overall|Primary|Middle|High|Overall') throw new Error('Missing K12Vista scores');
    const rows: LeaderboardRow[] = [];
    let input = '';
    for (const row of table.slice(2)) {
      if (row.every(cell => cell === row[0])) {
        const group = row[0].match(/^(?:MLLMs|LLMs): (Text \+ (?:Image|Captions)) as Input$/);
        if (!group) throw new Error('Unknown input group: ' + row[0]);
        input = group[1];
        continue;
      }
      if (!input || row.length !== 9) throw new Error('Incomplete K12Vista row');
      for (const [offset, prompt] of [[1, 'Direct inference'], [5, 'Step-by-step reasoning']] as const) {
        const [primary, middle, high, score] = row.slice(offset, offset + 4).map(v => numberCell(v));
        rows.push({ model: row[0], setting: prompt + ' (' + input + ')', score, metrics: { primary, middle, high } });
      }
    }
    return checked(rows, 58);
  },
};
export default board;
