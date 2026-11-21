// The source reports no overall score. The headline is the plain mean of the 14 parts, computed by this importer.
// mMARCO tests multilingual passage ranking. Table 2 gives development-set MRR@10 for English and thirteen translations.
import type { Leaderboard } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2108.13897';
const board: Leaderboard = {
  benchmark: 'mmarco', feed, url: feed, static: 'paper', terms: PAPER_TERMS + ' https://arxiv.org/licenses/',
  headline: 'The paper reports no overall MRR@10, so this is the plain mean across its fourteen language rows.',
  async fetch() {
    const table = flatPaperTables(await paperHtml(feed)).map(grid).find(t =>
      t[0]?.join('|') === '||R@1k|R@1k|MRR@10|MRR@10|MRR@10|MRR@10' && t[1]?.join('|') === '|Language|BM25|mColB.|BM25|mT5|mMiniLM|mColB.');
    if (!table) throw Error('Missing mMARCO main results');
    const languages = table.slice(2).filter(r => /^\(\d+\)$/.test(r[0]));
    if (languages.length !== 14) throw Error('Missing mMARCO language');
    board.parts = Object.fromEntries(languages.map(([, language]) => [language, language]));
    return checked(table[1].slice(4).map((label, i) => {
      const metrics: Record<string, number> = {};
      let sum = 0;
      for (const r of languages) {
        if (!r.slice(2).every(v => /^0\.\d+$/.test(v))) throw Error('Invalid retrieval metric for ' + r[1]);
        sum += metrics[r[1]] = Number(r[4 + i]);
        if (i === 0 || i === 3) metrics[r[1] + ' R@1k'] = Number(r[i === 0 ? 2 : 3]);
      }
      return { model: label === 'mColB.' ? 'mColBERT' : label, score: sum / languages.length, metrics };
    }), 4);
  },
};
export default board;
