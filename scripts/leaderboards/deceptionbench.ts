// DeceptionBench measures the percentage of responses that comply with deceptive requests.
// Table 3 repeats the evaluation under five prompt conditions and reports thought and response rates.
import type { Leaderboard } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2510.15501';
export default {
  benchmark: 'deceptionbench', static: 'paper', url: 'https://arxiv.org/abs/2510.15501', feed,
  stats: { thoughtDeceptionRate: { name: 'Thought deception rate', unit: '%', better: 'lower' } },
  terms: 'arXiv robots.txt allows the HTML paper. Results are credited to the DeceptionBench authors.',
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const table = tables.find(t => t[2]?.[2] === 'DR_{response}');
    const configs = tables.find(t => t[0]?.join('|') === 'Model Name|Reasoning Model|Parameters|Source|Settings');
    if (!configs || !table || table[1].join('|') !== 'Models|Baseline|Baseline|Pressure|Pressure|Reward|Reward|Pressure|Pressure|Reward|Reward')
      throw new Error('DeceptionBench columns changed');
    const rows = table.slice(3).filter(c => c[0] !== 'Reasoning Models').flatMap(cells => {
      const model = cells[0];
      const spec = configs.find(r => r[0].toLowerCase() === (model === 'GPT-3.5' ? 'GPT-3.5-Turbo' : model).toLowerCase());
      if (!spec || cells.length !== 11) throw new Error('Missing DeceptionBench model configuration');
      return [1, 3, 5, 7, 9].map(i => {
        const level = table[0][i].match(/^Level [123]/)?.[0];
        if (!level || table[2][i] !== 'DR_{thought}' || table[2][i + 1] !== 'DR_{response}') throw new Error('DeceptionBench measures changed');
        return { model, setting: [level, table[1][i], spec[4]].join(', '), score: numberCell(cells[i + 1]),
          open: spec[3] === 'Open-source', ...(spec[2].endsWith('B') ? { params: numberCell(spec[2].slice(0, -1)) } : {}),
          metrics: { thoughtDeceptionRate: numberCell(cells[i]) } };
      });
    });
    if (rows.length < 70) throw new Error('Missing DeceptionBench prompt conditions');
    return rows;
  },
} satisfies Leaderboard;
