// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// RMU:ECHR identifies the argument type and speaker in court rulings. Table 5 reports test macro F1 for both tasks.
import type { Leaderboard } from './types.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/html/2208.06178';
const board: Leaderboard = {
  benchmark: 'rmu-echr', url: feed, feed, static: 'paper',
  terms: PAPER_TERMS + ' https://arxiv.org/licenses/',
  headline: 'The paper reports no overall score, so this is the plain mean of test macro F1 for argument type and agent.',
  parts: { argumentType: 'Argument Type', agent: 'Agent' },
  stats: {
    argumentDev: { name: 'Argument type development F1', unit: '%', better: 'higher' },
    agentDev: { name: 'Agent development F1', unit: '%', better: 'higher' },
  },
  async fetch() {
    const table = flatPaperTables(await paperHtml(feed)).map(grid).find(t =>
      t[0]?.slice(1).join('|') === 'Argument Type|Argument Type|Agent|Agent' && t[1]?.slice(1).join('|') === 'Dev|Test|Dev|Test');
    if (!table || table.at(-1)?.[0] !== '\\bottomrule') throw Error('Missing Table 5');
    return checked(table.slice(2, -1).map(([name, ...cells]) => {
      if (cells.length !== 4 || !cells.every(s => /^\d+\.\d+$/.test(s))) throw Error('Changed F1 columns');
      const [argumentDev, argumentType, agentDev, agent] = cells.map(Number);
      const model = name.replace(/^\\midrule\s+/, '').replace(/\s+\(.*\)$/, '');
      return { model, score: (argumentType + agent) / 2, metrics: { argumentType, agent, argumentDev, agentDev } };
    }), 4);
  },
};
export default board;
