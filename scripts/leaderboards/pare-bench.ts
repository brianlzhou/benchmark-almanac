// Pare-Bench tests proactive assistants on personal digital tasks.
// Table 1 reports success rate with standard error across four runs, plus proposal, acceptance and read-action measures.
import type { Leaderboard } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';

const feed = 'https://arxiv.org/html/2604.00842';
const board: Leaderboard = {
  benchmark: 'pare-bench', static: 'paper', url: feed, feed,
  terms: 'Apple publishes the results under the terms listed at https://arxiv.org/abs/2604.00842.',
  aliases: { 'Claude 4.5 Sonnet': 'claude-sonnet-4-5', 'Qwen 3 4B Instruct': 'qwen3-4b-instruct-2507',
    'Llama 3.2 3B Instruct': 'llama-3-2-3b', 'Gemma 3 4B Instruct': 'gemma-3-4b' },
  stats: { passAt4: { name: 'Success@4', unit: '%', better: 'higher' }, pass4: { name: 'Success^4', unit: '%', better: 'higher' },
    stderr: { name: 'Success rate standard error', unit: '%' }, proposal: { name: 'Proposal rate', unit: '%', better: 'lower' },
    proposalSE: { name: 'Proposal rate standard error', unit: '%' }, acceptance: { name: 'Acceptance rate', unit: '%', better: 'higher' },
    acceptanceSE: { name: 'Acceptance rate standard error', unit: '%' }, readActions: { name: 'Read actions', unit: 'count' },
    readActionsSE: { name: 'Read actions standard error', unit: 'count' } },
  async fetch() {
    const table = inlinePaperTables(await paperHtml(feed)).find(t => t[0][1]?.startsWith('Success@4'));
    const columns = ['Model', 'Success@4', 'Success^4', 'Success Rate', 'Proposal Rate', 'Acceptance Rate', 'Read Actions'];
    if (!table || !columns.every((c, i) => table[0][i]?.startsWith(c))) throw new Error('Missing Pare-Bench Table 1');
    return checked(table.slice(1).map(([model, ...cells]) => {
      const values = cells.map((cell, i) => {
        const match = cell.match(/^(\d+(?:\.\d+)?)%?(?:\s*\\pm\s*(\d+(?:\.\d+)?)%?)?$/);
        if (!match || (i > 1 && !match[2])) throw new Error('Invalid Pare-Bench measure ' + cell);
        return [Number(match[1]), Number(match[2])];
      });
      const [at4, all4, success, proposal, acceptance, read] = values;
      return { model, score: success[0], trials: 4, metrics: { passAt4: at4[0], pass4: all4[0], stderr: success[1],
        proposal: proposal[0], proposalSE: proposal[1], acceptance: acceptance[0], acceptanceSE: acceptance[1],
        readActions: read[0], readActionsSE: read[1] } };
    }), 7);
  },
};
export default board;
