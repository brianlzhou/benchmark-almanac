// The source reports no overall score. The headline is the plain mean of the 3 parts, computed by this importer.
// AutoPLC tests compilation of structured text for industrial controllers. Table II reports three
// AutoPLC datasets and an additional external benchmark, Agents4PLC, excluded from the mean.
import type { Leaderboard } from './types.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';

const url = 'https://arxiv.org/html/2412.02410';
const datasets = ['LGF (SCL)', 'Competition (SCL)', 'OSCAT (ST)'];
const backbones: Record<string,string> = { AutoPLC: 'Claude-3.5-Sonnet', MapCoder: 'Claude-3.5-Sonnet', LLM4PLC: 'GPT-4o' };
const board: Leaderboard = {
  benchmark: 'autoplc', static: 'paper', url, feed: url, costPer: 'task',
  terms: 'The authors publish Table II under the license at https://arxiv.org/abs/2412.02410.',
  headline: 'The paper reports no overall score, so this is the plain mean of compilation pass rates on its three datasets.',
  parts: Object.fromEntries(datasets.map(name => [name, { name }])),
  stats: {
    'LGF (SCL) average errors': { name: 'LGF average errors', unit: 'count', better: 'lower' },
    'Competition (SCL) average errors': { name: 'Competition average errors', unit: 'count', better: 'lower' },
    'OSCAT (ST) average errors': { name: 'OSCAT average errors', unit: 'count', better: 'lower' },
    'Agents4PLC pass rate': { name: 'Agents4PLC pass rate', unit: '%', better: 'higher' },
    'Agents4PLC validation rate': { name: 'Agents4PLC validation rate', unit: '%', better: 'higher' },
  },
  aliases: { 'Llama-3.1-Instruct (8B)': 'llama-3-1-8b', 'Qwen2.5-Coder-Instruct (7B)': 'qwen2-5-coder-7b' },
  async fetch() {
    const table = paperTables(await paperHtml(url)).map(grid).find(t => t[0]?.join('|') === ['Baselines', ...[...datasets,'Agents4PLC (ST)'].flatMap(s => [s,s])].join('|'));
    if (!table || table[1].join('|') !== 'Baselines|Pass Rate|Avg. Errors|Pass Rate|Avg. Errors|Pass Rate|Avg. Errors|Pass Rate|Valid. Rate') throw new Error('Table II changed');
    const rows = table.slice(2).filter(c => c[0] !== 'Agents4PLC (paper)').map(c => {
      if (c.length !== 9 || c.slice(1).some(v => !/^\d+(?:\.\d+)?%?$/.test(v))) throw new Error('Invalid Table II row: ' + c[0]);
      const metrics: Record<string,number> = {};
      for (const [i,name] of datasets.entries()) {
        metrics[name] = parseFloat(c[1+i*2]);
        metrics[name+' average errors'] = Number(c[2+i*2]);
      }
      metrics['Agents4PLC pass rate'] = parseFloat(c[7]);
      metrics['Agents4PLC validation rate'] = parseFloat(c[8]);
      const harness = backbones[c[0]] ? c[0] : undefined;
      return { model: backbones[c[0]] ?? c[0], harness, metrics, score: datasets.reduce((sum,k) => sum+metrics[k],0)/3,
        cost: ['AutoPLC','LLM4PLC'].includes(c[0]) ? 0.13 : undefined };
    });
    return checked(rows,9);
  },
};
export default board;
