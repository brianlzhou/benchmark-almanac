// The source reports no overall score. The headline is the plain mean of the 5 parts, computed by this importer.
// Table 1 measures how often a model recovers the underlying equation from observations.
import type { BoardPart, Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2504.10415';
const groups = ['LSR-Transform', 'Chemistry', 'Biology', 'Physics', 'Material Science'];
const metricHeaders = ['SA (%)\\uparrow', 'Acc_{0.1}(%)\\uparrow', 'NMSE\\downarrow'];
const parts: Record<string, BoardPart> = {};
for (const group of groups) {
  parts[group] = { name: group, group: 'Symbolic accuracy' };
  parts[group + ' precision'] = { name: group, group: 'Numeric precision', unit: '%' };
  parts[group + ' NMSE'] = { name: group, group: 'Normalized mean squared error', unit: 'score', better: 'lower' };
}

const board: Leaderboard = {
  benchmark: 'llm-srbench', url: feed, feed, static: 'paper', parts,
  aliases: { 'Llama-3.1-8B-Instruct': 'llama-3-1-8b' },
  terms: 'The paper lists its license at https://arxiv.org/abs/2504.10415.',
  headline: 'The paper reports no overall score, so this is the plain mean of its five symbolic accuracy scores.',
  async fetch() {
    const table = flatPaperTables(await paperHtml(feed)).map(grid).find(t =>
      t[1]?.join('|') === ['Models', ...groups.flatMap(g => [g, g, g])].join('|') &&
      t[2]?.join('|') === ['Models', ...groups.flatMap(() => metricHeaders)].join('|'));
    if (!table) throw new Error('Missing Table 1 equation recovery results');
    const rows: LeaderboardRow[] = [];
    let method = '';
    for (const row of table.slice(3)) {
      if (row.every(cell => cell === row[0])) {
        method = row[0].replace(/ \( .*$/, '');
        if (!['Direct Prompting (DataBlind)', 'SGA', 'LaSR', 'LLM-SR'].includes(method)) throw new Error('Unknown method: ' + method);
        continue;
      }
      if (!method || row.length !== 16) throw new Error('Incomplete model row');
      const metrics: Record<string, number> = {};
      for (const [i, key] of Object.keys(parts).entries()) {
        const cell = row[i + 1];
        if (!/^\d+(?:\.\d+)?(?:e[+-]?\d+)?$/i.test(cell)) throw new Error('Invalid score: ' + cell);
        metrics[key] = Number(cell);
      }
      const score = groups.reduce((sum, g) => sum + metrics[g], 0) / groups.length;
      const configuration = method === 'Direct Prompting (DataBlind)' ? { setting: method } : { harness: method };
      rows.push({ model: row[0], score, metrics, ...configuration });
    }
    return checked(rows, 12);
  },
};
export default board;
