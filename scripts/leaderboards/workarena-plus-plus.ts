// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// WorkArena++ tests enterprise tasks in ServiceNow. Table 2 gives success rates and standard errors for L2 and L3.
import type { Leaderboard } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://arxiv.org/html/2407.05291';
const board: Leaderboard = {
  benchmark: 'workarena-plus-plus', url: feed, feed, static: 'paper',
  terms: 'The authors publish the results on arXiv. https://arxiv.org/licenses/nonexclusive-distrib/1.0/',
  headline: 'The paper reports no overall WorkArena++ success rate, so this is the plain mean of L2 and L3.',
  parts: { L2: 'WorkArena L2', L3: 'WorkArena L3', L2InformationRetrieval: { name: 'Information retrieval', group: 'WorkArena L2', unit: '%', better: 'higher' }, L2SophisticatedMemorization: { name: 'Sophisticated memorization', group: 'WorkArena L2', unit: '%', better: 'higher' } },
  aliases: { 'gpt-3.5-turbo-1106': 'gpt-3-5-turbo-nov-2023', 'meta-llama-3-70B-instruct': 'llama-3-70b', 'open-mixtral-8x22b': 'mixtral-8x22b' },
  async fetch() {
    const t = paperTables(await paperHtml(feed)).map(grid).find(t => t[0].includes('Agent Curriculum') && t[1].includes('(full benchmark)'));
    if (!t) throw new Error('Missing WorkArena agent curriculum');
    const ids: Record<string,string> = { 'GPT-3.5': 'gpt-3.5-turbo-1106', 'GPT-4o': 'gpt-4o-2024-05-13',
      'GPT-4o-v': 'gpt-4o-2024-05-13', Llama3: 'meta-llama-3-70B-instruct', Mixtral: 'open-mixtral-8x22b' };
    const rows = [];
    for (let c = 1; t[0][c] === 'Agent Curriculum'; c += 2) {
      const label = t[2][c];
      if (!ids[label]) throw new Error('Unknown model ' + label);
      const metrics: Record<string, number> = {};
      for (const level of ['L2', 'L3']) {
        const index = t.findIndex(r => r[0] === 'WorkArena ' + level + ' (235)');
        if (index < 0) throw new Error('Missing level ' + level);
        metrics[level] = numberCell(t[index][c]);
        metrics[level + 'Stderr'] = numberCell(t[index][c + 1].replace(/^\\pm\s*/, ''));
        for (const row of t.slice(index + 1, index + 6)) {
          const category = row[0].replace(/ \(\d+\)$/, '');
          const key = level + category.replace(/[^a-zA-Z]/g, '');
          board.parts![key] = { name: category, group: level };
          metrics[key] = numberCell(row[c]);
          metrics[key + 'Stderr'] = numberCell(row[c + 1].replace(/^\\pm\s*/, ''));
        }
      }
      rows.push({ model: ids[label], setting: label === 'GPT-4o-v' ? 'With screenshots' : 'Text only',
        metrics, score: (metrics.L2 + metrics.L3) / 2 });
    }
    return checked(rows, 5);
  },
};
export default board;
