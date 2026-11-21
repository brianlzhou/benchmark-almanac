// TV-AD evaluates generated audio descriptions of television episodes. Table 3 reports CIDEr first for TV-AD.
// The paper also gives CRITIC and two LLM-AD-eval scores, one per judge.
import type { Leaderboard } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { grid, paperTables, checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://arxiv.org/html/2407.15850';
const board: Leaderboard = {
  benchmark: 'tv-ad', url: feed, feed, static: 'paper',
  terms: 'The authors publish Table 3 under the terms linked at https://arxiv.org/abs/2407.15850.',
  async fetch() {
    const t = paperTables(await paperHtml(feed)).map(grid).find(t => t[0]?.slice(6).join('|') === 'TV-AD|TV-AD|TV-AD' && t[1]?.slice(6).join('|') === 'CIDEr|CRITIC|LLM-AD-eval');
    if (!t) throw new Error('TV-AD results missing');
    const clean = (s: string) => s.replace(/\^\{\*\}|[{}]/g, '').trim();
    const rows = t.slice(2).filter(r => r[6] !== '-').map(r => {
      const judges = clean(r[8]).split('|').map(c => numberCell(c.trim()));
      if (judges.length !== 2) throw new Error('TV-AD judge metrics missing');
      return { model: r[0].replace(' (Ours)', ''), score: numberCell(clean(r[6])),
        setting: r[1] === '✗' ? 'Trained on TV-AD' : 'Training-free',
        metrics: { critic: numberCell(clean(r[7])), llama2Eval: judges[0], llama3Eval: judges[1] } };
    });
    return checked(rows, 2);
  },
};
export default board;
