// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// DeepResearch Arena evaluates seminar-grounded research reports. Table 3 compares English and Chinese checklist scores.
// The companion keypoint rates measure factual coverage, conflicts and omissions on a different scale.
import type { Leaderboard } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, flatPaperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2509.01396';
const board: Leaderboard = {
  stats: { enKSR:{name:'English knowledge search rate',unit:'%',better:'higher'}, zhKSR:{name:'Chinese knowledge search rate',unit:'%',better:'higher'}, enKCR:{name:'English knowledge citation rate',unit:'%',better:'higher'}, zhKCR:{name:'Chinese knowledge citation rate',unit:'%',better:'higher'}, enKOR:{name:'English knowledge organization rate',unit:'%',better:'higher'}, zhKOR:{name:'Chinese knowledge organization rate',unit:'%',better:'higher'}, enTokens:{name:'English tokens',unit:'tokens'}, zhTokens:{name:'Chinese tokens',unit:'tokens'}, enReferences:{name:'English references',unit:'count'}, zhReferences:{name:'Chinese references',unit:'count'} },
  benchmark: 'deepresearch-arena', feed, url: feed, static: 'paper',
  terms: 'The authors publish Table 3 under the terms linked at https://arxiv.org/abs/2509.01396.',
  headline: 'The headline averages the English and Chinese ACE checklist scores that the paper compares across models.',
  aliases: { 'o4-mini-deepresearch': 'o4-mini-deep-research' },
  parts: { enACE: 'English ACE', zhACE: 'Chinese ACE' },
  async fetch() {
    const table = flatPaperTables(await paperHtml(feed)).map(grid).find(t =>
      t[1]?.slice(1).join('|') === 'KSR|KCR|KOR|ACE|Avg. Token (k)|Avg. references');
    if (!table) throw new Error('Missing DeepResearch Arena Table 3');
    const keys = ['KSR', 'KCR', 'KOR', 'ACE', 'Tokens', 'References'];
    const rows = table.slice(2).map(([label, ...cells]) => {
      if (cells.length !== keys.length) throw new Error('Unexpected DeepResearch Arena columns');
      const metrics: Record<string, number> = {};
      cells.forEach((cell, i) => {
        const pair = cell.split(/\s+/).map(numberCell);
        if (pair.length !== 2) throw new Error('Expected paired English and Chinese results');
        for (const [j, lang] of ['en', 'zh'].entries()) metrics[lang + keys[i]] = pair[j] * (keys[i] === 'Tokens' ? 1000 : 1);
      });
      const model = label.replace(/ w\/search$/, '');
      return { model: model === 'gemini-2.5-flash' ? model + ' (snapshot unspecified)' : model, setting: label.endsWith(' w/search') ? 'With search' : undefined,
        score: (metrics.enACE + metrics.zhACE) / 2, metrics };
    });
    return checked(rows, 8);
  },
};
export default board;
