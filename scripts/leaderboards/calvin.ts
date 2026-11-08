// CALVIN: use only Train A, B, C to Test D, the unseen-environment split in this catalog record.
// Avg. Len. is the published average chain length out of five. Chain success percentages stay in metrics.
// Input sensors distinguish whole-benchmark configurations. Other train/test splits never become rows here.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';

const PAGE = 'http://calvin.cs.uni-freiburg.de/';
const board: Leaderboard = {
  benchmark: 'calvin', url: PAGE, feed: PAGE,
  terms: 'The CALVIN authors publish this public HTML leaderboard, with attribution retained and no separate score reuse license stated.',
  async fetch() {
    const html = (await fetchText(PAGE)).replace(/<!--[\s\S]*?-->/g, '');
    const heading = [...html.matchAll(/<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>/g)].find(m => /^Train A, B, C\s*→\s*Test D$/.test(text(m[0])));
    if (!heading) throw new Error('CALVIN ABC-to-D heading missing');
    const table = tables(html.slice(heading.index))[0];
    if (!table?.[2]?.some(c => c.text === 'Avg. Len.')) throw new Error('CALVIN average chain length column missing');
    const rows = table.slice(3).filter(r => r.length === 9 && num(r[8].text) !== undefined).map(r => ({
      model: r[0].text, setting: r[1].text, score: num(r[8].text)!,
      metrics: Object.fromEntries([1, 2, 3, 4, 5].flatMap(k => {
        const value = num(r[k + 2].text);
        return value === undefined ? [] : [[`chain${k}`, value]];
      })),
    }));
    if (!rows.length) throw new Error('CALVIN ABC-to-D results missing');
    return rows;
  },
};
export default board;
