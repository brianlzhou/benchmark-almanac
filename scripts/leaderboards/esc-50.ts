// ESC-50 tests environmental sound classification. The official repository results table reports accuracy for named methods.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://raw.githubusercontent.com/karolpiczak/ESC-50/master/README.md';
const board: Leaderboard = {
  benchmark: 'esc-50', url: 'https://github.com/karolpiczak/ESC-50', feed,
  terms: 'The repository is licensed under CC BY-NC. https://github.com/karolpiczak/ESC-50/blob/master/LICENSE',
  async fetch() {
    const text = await fetchText(feed);
    const rows = text.split('\n').flatMap(line => {
      const m = line.match(/^\|\s*(?:<sub>)?(?:\*\*)?(.+?)(?:\*\*)?(?:<\/sub>)?\s*\|\s*(?:<sub>)?(.+?)(?:<\/sub>)?\s*\|\s*(?:<sub>)?\*?([\d.]+)%/);
      if (!m || /human accuracy|random forest|baseline -|baseline SVM|baseline k-NN/i.test(m[1])) return [];
      const model = m[1].replace(/<[^>]+>/g, '').replace(/[*:]/g, '').trim();
      const setting = m[2].replace(/<[^>]+>/g, '').replace(/[*:]/g, '').trim();
      const cells = line.trim().replace(/^\||\|$/g, '').split('|');
      const linkOf = (cell?: string) => cell?.match(/\((https?:\/\/[^)\s]+)\)|href=["'](https?:\/\/[^"']+)["']/i)?.slice(1).find(Boolean);
      const link = linkOf(cells[3]) ?? linkOf(cells[4]);
      return [{ model, setting, score: Number(m[3]), ...(link ? { link } : {}) }];
    });
    return checked(rows, 50);
  },
};
export default board;
