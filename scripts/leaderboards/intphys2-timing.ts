// IntPhys2-Timing tests whether a predicted interval overlaps a physical violation.
// Table 3 gives overall hit rates. Table 7 breaks them down by attribute and difficulty.
import type { Leaderboard } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2610.31429';
const attributes = ['Continuity', 'Immutability', 'Permanence', 'Solidity'];
const difficulty = ['Easy', 'Medium', 'Hard', 'Unknown', 'All'];
const metric = (attr: string, level: string) => attr + ': ' + level;
const groups: Record<string, string> = {
  'Qwen3.8-27B': 'Ours [3pt](Qwen)', 'Gemini-3.8-Flash': 'Ours [3pt](Gemini)',
  'GPT-5.4': 'Ours [3pt](GPT)', 'V-JEPA2-h': 'VoE',
};
export default {
  benchmark: 'intphys2-timing', url: feed, feed, static: 'paper',
  terms: 'Paper and license at https://arxiv.org/abs/2610.31429',
  parts: Object.fromEntries(attributes.flatMap(attr => difficulty.map(level => {
    const name = metric(attr, level);
    return [name, {name, unit: '%' as const}];
  }))),
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const main = tables.find(t => t[0].join('|') === 'Model|Overall' && t.some(r => r[0].includes('VoE')));
    const detail = tables.find(t => t[0].join('|') === 'Method|Attribute|Easy|Med.|Hard|Unk.|All|Avg');
    if (!main || !detail) throw new Error('Missing IntPhys2-Timing results');
    return checked(main.slice(1).flatMap(([label, overall]) => {
      if (label.startsWith('Window-based MLLM')) return [];
      const match = label.match(/^(Ours|VoE) \(([^\s)]+)(?: \[ \d+ \] )?\)$/);
      if (!match || !/^\d+\.\d+$/.test(overall)) throw new Error('Invalid hit-rate row: ' + label);
      const [, method, model] = match;
      const metrics: Record<string, number> = {};
      if (groups[model]) {
        for (const attr of attributes) {
          const row = detail.find(r => r[0] === groups[model] && r[1] === attr);
          if (!row || row[7] !== overall) throw new Error('Missing hit rates: ' + model + ' ' + attr);
          difficulty.forEach((level, i) => {
            const cell = row[i + 2];
            if (!/^\d+(?:\.\d+)?$/.test(cell)) throw new Error('Invalid hit rate: ' + cell);
            metrics[metric(attr, level)] = Number(cell);
          });
        }
      }
      return [{model, harness: method === 'Ours' ? 'PhysTrace' : 'VoE', score: Number(overall), metrics}];
    }), 5);
  },
} satisfies Leaderboard;
