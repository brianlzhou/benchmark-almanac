import type { Leaderboard } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';
const URL = 'https://arxiv.org/html/1709.05522';
const board: Leaderboard = {
  benchmark: 'aishell-1', parts: {
  devCER: { name: 'Development', group: 'Split' },
}, url: URL, feed: URL + ' (test-set CER, lower is better)', terms: PAPER_TERMS,
  async fetch() {
    const t = inlinePaperTables(await paperHtml(URL)).find(t => t[0]?.[2] === 'CER of test');
    if (!t || t.length < 4) throw new Error('AISHELL-1 results missing');
    return t.slice(1).map(r => ({model: r[0], score: parseFloat(r[2]), setting: 'supervised; AISHELL-1 test', harness: 'Kaldi', metrics: {devCER: parseFloat(r[1])}}));
  },
};
export default board;
