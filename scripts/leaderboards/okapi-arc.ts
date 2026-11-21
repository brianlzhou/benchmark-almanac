// Okapi ARC tests multiple-choice science reasoning across 26 non-English languages.
// Table 3 reports accuracy by language and the overall average for BLOOM-based models.
// Table 6 covers only 14 languages and does not contribute a whole-benchmark score.
import type { Leaderboard } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, flatPaperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2307.16039';
const board: Leaderboard = {
  benchmark: 'okapi-arc', url: feed, feed, static: 'paper',
  terms: 'Paper and license details at https://arxiv.org/abs/2307.16039.',
  parts: { 'High-Resource': { name: 'High-resource languages', group: 'Resource level' }, 'Medium-Resource': { name: 'Medium-resource languages', group: 'Resource level' }, 'Low-Resource': { name: 'Low-resource languages', group: 'Resource level' } },
  async fetch() {
    const html = (await paperHtml(feed)).replace(/<cite\b[^>]*>[\s\S]*?<\/cite>/gi, '');
    const tables = flatPaperTables(html).map(grid);
    const candidates = tables.filter(t => t[0].join() === ',Language,BLOOM,BLOOMZ,SFT,RLHF');
    const table = candidates[0];
    if (!table || table[1]?.[1] !== 'Russian' || candidates.length !== 3 || table.at(-1)?.[1] !== 'Average') throw new Error('Missing Table 3 averages');
    const languages = table.slice(1).filter(r => r[0]);
    if (languages.length !== 26) throw new Error('Expected 26 language results');
    board.parts = Object.fromEntries(languages.map(r => [r[1], { name: r[1], group: 'Language' }]));
    const names = ['BLOOM 7B', 'BLOOMZ 7B', 'Okapi BLOOM 7B SFT', 'Okapi BLOOM 7B RLHF'];
    const rows = names.map((model,i) => {
      const col = i + 2;
      const metrics = Object.fromEntries(languages.map(r => [r[1], numberCell(r[col])]));
      let group = '';
      for (const r of table.slice(1)) {
        if (r[0]) group = r[0];
        if (r[1] === 'Ave Group') metrics[group] = numberCell(r[col]);
      }
      return { model, score: numberCell(table.at(-1)![col]), params: 7, metrics };
    });
    return checked(rows, 4);
  },
};
export default board;
