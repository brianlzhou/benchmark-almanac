// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// LitSearch tests scientific paper retrieval. Table 3 reports recall at 20 for broad queries and at 5 for specific queries.
import type { Leaderboard } from './types.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2407.18940';
const board: Leaderboard = {
  benchmark: 'litsearch', static: 'paper', url: feed, feed,
  terms: 'The authors publish Table 3 under the terms at https://arxiv.org/abs/2407.18940.',
  headline: 'The paper reports broad-query recall at 20 and specific-query recall at 5. The headline averages those two scores.',
  parts: { broad: 'Broad R@20', specific: 'Specific R@5', inlineBroad: 'Inline-citation broad R@20',
    inlineSpecific5: 'Inline-citation specific R@5', inlineSpecific20: 'Inline-citation specific R@20',
    authorBroad: 'Author-written broad R@20', authorSpecific5: 'Author-written specific R@5',
    authorSpecific20: 'Author-written specific R@20' },
  harnesses: 'system',
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid).find(rows =>
      rows[0]?.join('|') === '|Inline-citation|Inline-citation|Inline-citation|Author-written|Author-written|Author-written|Avg.|Avg.');
    if (table?.[1]?.join('|') !== '|Broad|Specific|Specific|Broad|Specific|Specific|Broad|Specific' ||
        table[2].join('|') !== '|R@20|R@5|R@20|R@20|R@5|R@20|R@20|R@5') throw new Error('Missing Table 3 recall columns');
    return checked(table.slice(3).map(([name, ...cells]) => {
      if (cells.length !== 8) throw new Error('Incomplete LitSearch row');
      const [inlineBroad, inlineSpecific5, inlineSpecific20, authorBroad, authorSpecific5, authorSpecific20, broad, specific] = cells.map(numberCell);
      const system = name.match(/^(GPT-4o) (.+)$/);
      return { model: system?.[1] ?? name, harness: system?.[2], score: (broad + specific) / 2,
        metrics: { broad, specific, inlineBroad, inlineSpecific5, inlineSpecific20, authorBroad, authorSpecific5, authorSpecific20 } };
    }), 9);
  },
};
export default board;
