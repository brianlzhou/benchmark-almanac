import type { Leaderboard } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';
import { paperModel } from '../lib/boards/arxiv-nested-tables.ts';
const URL = 'https://arxiv.org/html/2512.04921';
const board: Leaderboard = {
  benchmark: 'ace-mercor', static: 'paper', url: URL, feed: URL + ' (overall benchmark score table)', terms: PAPER_TERMS,
  parts: {
    DIY: { name: 'DIY', group: 'Category' },
    Food: { name: 'Food', group: 'Category' },
    Gaming: { name: 'Gaming', group: 'Category' },
    Shopping: { name: 'Shopping', group: 'Category' },
  },
  aliases: {'Opus 4.1': 'claude-opus-4-1', 'Opus 4.5': 'claude-opus-4-5', 'Sonnet 4.5': 'claude-sonnet-4-5'},
  async fetch() {
    const tables = inlinePaperTables(await paperHtml(URL));
    const t = tables.find(t => t[0]?.[2] === 'Overall' && t[0]?.[3] === 'DIY');
    const intervals = tables.find(t => t[0]?.[3] === 'CI Lower (%)');
    if (!t || t.length < 4) throw new Error('ACE overall table missing');
    return t.slice(1).map(r => ({model: paperModel(r[0].replace(/ \([^)]+\)$/, '')), score: parseFloat(r[2]),
      low: Number(intervals?.slice(1, 11).find(x => x[1] === r[0])?.[3]),
      high: Number(intervals?.slice(1, 11).find(x => x[1] === r[0])?.[4]),
      setting: 'reasoning: ' + r[0].match(/\(([^)]+)\)$/)?.[1],
      metrics: Object.fromEntries(r.slice(3).map((s, i) => [t[0][i + 3], parseFloat(s)]))}));
  },
};
export default board;
