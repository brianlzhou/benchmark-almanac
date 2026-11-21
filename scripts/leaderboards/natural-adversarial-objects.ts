// Natural Adversarial Objects tests object detectors on unmodified photographs that induce classification errors.
// Table 2 reports mean average precision on NAO, mean average recall, and precision after excluding out-of-distribution objects.
import type { Leaderboard } from './types.ts';
import { paperHtml, numberCell, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2111.04204';
const board: Leaderboard = {
  benchmark: 'natural-adversarial-objects', static: 'paper', url: 'https://labs.scale.com/papers/natural-adversarial-objects', feed,
  terms: PAPER_TERMS + ' https://arxiv.org/abs/2111.04204',
  parts: { inDistribution: 'mAP without out-of-distribution objects' },
  async fetch() {
    const table = inlinePaperTables(await paperHtml(feed)).find(t => t[0]?.slice(4).join('|') === 'NAO|NAO|NAO');
    if (!table || table[1].slice(1).join('|') !== 'Params|mAP|mAP|mAP|mAR|mAP w/o out-of-distribution') {
      throw new Error('Missing NAO columns in the comparison table');
    }
    return checked(table.slice(2).map(([model, params, , , map, mar, inDistribution]) => {
      if (!/^\d+(\.\d+)?M$/.test(params)) throw new Error('Unexpected parameter count');
      return {model, score: numberCell(map), params: numberCell(params.slice(0,-1)) / 1000,
        metrics: { meanAverageRecall: numberCell(mar), inDistribution: numberCell(inDistribution) }};
    }), 7);
  },
};
export default board;
