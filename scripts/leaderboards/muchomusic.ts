import type { Leaderboard } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';
const URL = 'https://arxiv.org/html/2408.01337';
const board: Leaderboard = {
  benchmark: 'muchomusic', static: 'paper', parts: {
  knowledge: { name: 'Knowledge', group: 'Task type' },
  reasoning: { name: 'Reasoning', group: 'Task type' },
}, url: URL, feed: URL + ' (all-question accuracy)', terms: PAPER_TERMS,
  async fetch() {
    const t = inlinePaperTables(await paperHtml(URL)).find(t => t[0]?.[4] === 'IFR');
    if (!t || t.length < 5) throw new Error('MuchoMusic results missing');
    return t.slice(2).filter(r => r[0] !== 'Random guessing').map(r => ({model: r[0].replace(/\s*\[\s*\d+\s*\]/g, ''), score: Number(r[1]),
      metrics: {knowledge: Number(r[2]), reasoning: Number(r[3]), instructionFollowing: Number(r[4])}}));
  },
};
export default board;
