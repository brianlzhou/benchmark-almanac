import type { Leaderboard } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';
import { paperModel } from '../lib/boards/arxiv-nested-tables.ts';
const URL = 'https://arxiv.org/html/2511.10507';
const board: Leaderboard = {
  benchmark: 'advancedif', parts: {
  CC: { name: 'Carried context', group: 'Category' },
  SS: { name: 'System steerability', group: 'Category' },
}, url: URL, feed: URL + ' (Table 3 average)', terms: PAPER_TERMS,
  aliases: {"Claude 4 Sonnet": "claude-sonnet-4"},
  async fetch() {
    const t = inlinePaperTables(await paperHtml(URL)).find(t => t[0]?.[0] === 'Mode' && t[0]?.[5] === 'avg');
    if (!t || t.length < 4) throw new Error('AdvancedIF main table missing');
    return t.slice(1).map(r => ({model: paperModel(r[1]), setting: r[0], score: Number(r[5]), metrics: {CIF: Number(r[2]), CC: Number(r[3]), SS: Number(r[4])}}));
  },
};
export default board;
