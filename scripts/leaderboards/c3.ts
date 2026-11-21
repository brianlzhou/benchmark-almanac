import type { Leaderboard } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';
const URL = 'https://arxiv.org/html/1904.09679';
const board: Leaderboard = {
  benchmark: 'c3', static: 'paper', parts: {
  mixedDev: { name: 'Mixed development', group: 'Split' },
  mixedTest: { name: 'Mixed test', group: 'Split' },
  dialogueDev: { name: 'Dialogue development', group: 'Split' },
  dialogueTest: { name: 'Dialogue test', group: 'Split' },
  dev: { name: 'Development', group: 'Split' },
}, url: URL, feed: URL + ' (combined C3 test accuracy)', terms: PAPER_TERMS,
  async fetch() {
    const t = inlinePaperTables(await paperHtml(URL)).find(t => t[0]?.[5] === 'C 3' && t[1]?.[6] === 'Test');
    if (!t) throw new Error('C3 result table missing');
    const rows = t.slice(2).filter(r => !/^(Random|Human)/.test(r[0])).map(r => ({model: r[0].replace(/ (?:Richardson|Wang|Devlin|Sun|Cui) et al\..*$/, ''),
      score: Number(r[6]), setting: 'supervised Chinese reading comprehension',
      metrics: {mixedDev: Number(r[1]), mixedTest: Number(r[2]), dialogueDev: Number(r[3]), dialogueTest: Number(r[4]), dev: Number(r[5])}}));
    if (rows.length < 3) throw new Error('C3 has too few model results');
    return rows;
  },
};
export default board;
