// BIRD-Python measures execution accuracy for pandas programs answering database questions.
// Table 1 provides total and difficulty scores on verified references. Table 2 adds logical clarifications.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { grid, checked, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2601.15728';
const board: Leaderboard = {
  benchmark: 'bird-python', static: 'paper', url: feed, feed,
  terms: 'The authors publish these tables in their paper. https://arxiv.org/abs/2601.15728',
  parts: { simple: 'Simple', moderate: 'Moderate', challenging: 'Challenging' },
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const rows: LeaderboardRow[] = [];
    function add(model: string, setting: string, cells: string[]) {
      if (cells.length !== 4 || !cells.every(c => /^\d+(?:\.\d+)?$/.test(c))) throw new Error('Invalid pandas accuracy');
      const [simple, moderate, challenging, score] = cells.map(Number);
      rows.push({model, score, setting, metrics: {simple, moderate, challenging}});
    }
    for (const type of ['Verified', 'Setting']) {
      const table = tables.find(([header]) => header?.includes(type) && header.includes('Code Generation Accuracy (%)'));
      if (!table) throw new Error('Missing ' + type + ' results table');
      const offset = table[0].indexOf('Code Generation Accuracy (%)');
      if (table[1].slice(offset,offset+4).join() !== 'Simple,Mod.,Hard,Total') throw new Error('Unexpected difficulty columns');
      for (let i=2; i<table.length; i++) {
        const row = table[i];
        if (type === 'Verified' && row[2] === '✓') {
          const sizeRow = table[i+1];
          if (sizeRow?.[2] !== '✗') throw new Error('Missing paired reference row');
          const size = sizeRow[0].match(/^\((\d+B)\)$/)?.[1];
          add(row[0] + (size ? '-' + size : ''), 'Standard', row.slice(offset,offset+4));
        }
        if (type === 'Setting' && row[1] === 'LCF') add(row[0], 'Logical clarifications', row.slice(offset,offset+4));
      }
    }
    return checked(rows, 17);
  },
};
export default board;
