// XNLIeu tests natural-language inference in Basque.
// The headline is accuracy on the native XNLIeu test set, reported in percent.
// This importer reads the paper's discriminative and generative result tables.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const URL = 'https://arxiv.org/html/2404.06996';
const board: Leaderboard = {
  benchmark: 'xnlieu', static: 'paper', url: URL, feed: URL, terms: PAPER_TERMS,
  async fetch() {
    const tables = paperTables(await paperHtml(URL)).map(grid);
    const resultTables = tables.filter(t => t.some(r => r.includes('XNLIeu')) && t.some(r => r.some(c => /IXAmBERT|Latxa/.test(c))) && !t.some(r => r.includes('native')));
    if (!resultTables.length) throw new Error('XNLIeu result tables missing');
    const rows: LeaderboardRow[] = [];
    for (const table of resultTables) {
      let setting = 'reported configuration';
      for (const row of table) {
        const label = row.find(c => /zero-shot|translate-train/i.test(c));
        if (label) { setting = label.trim(); if (row.length <= 2 || !row[0] || /zero-shot|translate-train/i.test(row[0])) continue; }
        if (!row.includes('XNLIeu') && row.length < 2) continue;
        const model = row[0]?.trim();
        const score = Number(row[1]?.match(/\d+(?:\.\d+)?/)?.[0]);
        if (!model || !Number.isFinite(score) || /^(zero-shot|translate-train|prompting)$/i.test(model) || model === 'Model') continue;
        const mt = Number(row[2]?.match(/\d+(?:\.\d+)?/)?.[0]);
        rows.push({ model, score, setting, ...(Number.isFinite(mt) ? { metrics: { xnlieuMt: mt } } : {}) });
      }
    }
    return checked(rows, 2);
  },
};
export default board;
