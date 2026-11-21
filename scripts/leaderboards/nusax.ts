// NusaX tests sentiment classification across twelve languages. Table 3 reports
// average macro-F1 for single-language training. Table 7 also tests multilingual and leave-one-language-out training.
import type { Leaderboard } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2205.15960';
const board: Leaderboard = {
  benchmark: 'nusax', url: feed, feed, static: 'paper',
  terms: 'Paper and license details at https://arxiv.org/abs/2205.15960.',
  parts: { ace: 'Acehnese', ban: 'Balinese', bbc: 'Toba Batak', bjn: 'Banjarese', bug: 'Buginese', eng: 'English',
    ind: 'Indonesian', jav: 'Javanese', mad: 'Madurese', min: 'Minangkabau', nij: 'Ngaju', sun: 'Sundanese' },
  async fetch() {
    const html = (await paperHtml(feed)).replace(/<cite\b[^>]*>[\s\S]*?<\/cite>/gi, '');
    const tables = paperTables(html).map(grid);
    const main = tables.find(t => t[0].join() === 'Model,ace,ban,bbc,bjn,bug,eng,ind,jav,mad,min,nij,sun,avg');
    const training = tables.find(t => t[0].join() === 'Language,Single,Multi,LOLO');
    if (!main || !training || training.at(-1)?.[0] !== 'Average') throw new Error('Missing NusaX sentiment tables');
    const languages = main[0].slice(1,-1);
    const rows = main.slice(1).map(r => ({
      model: r[0].replace(/\{\}_\{\\textnormal\{(BASE|LARGE)\}\}/g, (_, size: string) => '-' + size.toLowerCase()),
      setting: 'Single', score: numberCell(r[13]),
      metrics: Object.fromEntries(languages.map((key,i) => [key, numberCell(r[i+1])])),
    }));
    const names = Object.fromEntries(Object.entries(board.parts!).map(([k,v]) => [String(v).toLowerCase(), k]));
    const average = training.at(-1)!;
    for (let col = 1; col <= 3; col++) {
      const metrics: Record<string, number> = {};
      for (const r of training.slice(1,-1)) {
        const key = names[r[0].toLowerCase()];
        if (!key) throw new Error('Unknown Table 7 language: ' + r[0]);
        metrics[key] = numberCell(r[col]);
      }
      if (Object.keys(metrics).length !== 12) throw new Error('Incomplete Table 7');
      if (col === 1) {
        const single = rows.find(r => r.model === 'XLM-R-large');
        if (!single) throw new Error('Missing XLM-R-large');
        single.score = numberCell(average[col]);
      } else {
        rows.push({ model: 'XLM-R-large', setting: training[0][col], score: numberCell(average[col]), metrics });
      }
    }
    return checked(rows, 11);
  },
};
export default board;
