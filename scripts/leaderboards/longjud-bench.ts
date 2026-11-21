// The source reports no overall score. The headline is the plain mean of the 8 parts, computed by this importer.
// LongJud-Bench evaluates lawyers across civil litigation stages. Table 3 reports eight capabilities on a
// zero-to-one scale. Seven have scores at two instances, which are averaged within each capability.
import type { BoardPart, Leaderboard } from './types.ts';
import { PAPER_TERMS, numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://arxiv.org/html/2606.18728';
const capabilities = ['Issue Spotting', 'Party Identification', 'Claim Construction', 'Fact Marshalling',
  'Evidence Marshalling', 'Position Consistency', 'Evidentiary Advocacy', 'Legal Reasoning'];
const board: Leaderboard = {
  benchmark: 'longjud-bench', static: 'paper', url, feed: url, terms: PAPER_TERMS,
  headline: 'The cross-model table reports no overall score, so this is the plain mean of eight capabilities, averaging the two instances where applicable.',
  async fetch() {
    const table = flatPaperTables(await paperHtml(url)).map(grid).find(t => t[1]?.join('|') === ['Model', ...capabilities].join('|'));
    if (!table) throw new Error('Missing LongJud-Bench cross-model comparison');
    const parts: Record<string, BoardPart> = {};
    const rows = table.slice(2).map(([model, ...cells]) => {
      if (cells.length !== 8) throw new Error('Incomplete capabilities for ' + model);
      const metrics: Record<string, number> = {};
      const scores = cells.map((cell, i) => {
        const key = capabilities[i], values = cell.split('/').map(s => numberCell(s));
        if (values.length !== (i === 0 ? 1 : 2)) throw new Error('Unexpected litigation instances for ' + key);
        parts[key] = { name: key, group: table[0][i + 1], unit: 'score' };
        if (values.length === 2) {
          for (const [j, instance] of ['First instance', 'Second instance'].entries()) {
            metrics[key + instance] = values[j];
            parts[key + instance] = { name: key, group: instance, unit: 'score' };
          }
        }
        metrics[key] = values.reduce((sum, v) => sum + v, 0) / values.length;
        return metrics[key];
      });
      return { model, harness: 'LegalWorld', score: scores.reduce((sum, v) => sum + v, 0) / scores.length, metrics };
    });
    board.parts = parts;
    return checked(rows, 6);
  },
};
export default board;
