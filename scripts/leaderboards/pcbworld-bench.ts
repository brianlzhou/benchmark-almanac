// The source reports no overall score. The headline is the plain mean of the 3 parts, computed by this importer.
// PCBWorld tests printed circuit board routing. Table 3 reports clean-pass fractions for D2, D3-A and D3-B.
// The @5 protocol selects the rollout with the largest potential gain from five attempts on each board.
import { checked, paperTables, grid } from '../lib/boards/arxiv-span-tables.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import type { Leaderboard, LeaderboardRow } from './types.ts';

const feed = 'https://arxiv.org/html/2607.05915';
const splits = ['D2', 'D3-A', 'D3-B'];
const board: Leaderboard = {
  benchmark: 'pcbworld-bench', static: 'paper', url: 'https://arxiv.org/abs/2607.05915', feed,
  terms: 'The authors publish Table 3 under the terms linked at https://arxiv.org/abs/2607.05915.',
  headline: 'The paper reports no overall score, so this is the plain mean of the clean-pass fractions on D2, D3-A and D3-B.',
  parts: Object.fromEntries(splits.map(name => [name, {name, note: 'Fraction of boards with a clean pass.'}])),
  stats: {
    D2Potential: { name: 'D2 potential gain', unit: 'score', better: 'higher' },
    D2Routability: { name: 'D2 routability', unit: 'score', better: 'higher', note: 'Fraction of target connections successfully routed, stored from 0 to 1.' },
    D2Seconds: { name: 'D2 wallclock time', unit: 'seconds', better: 'lower' },
    'D3-APotential': { name: 'D3-A potential gain', unit: 'score', better: 'higher' },
    'D3-ARoutability': { name: 'D3-A routability', unit: 'score', better: 'higher', note: 'Fraction of target connections successfully routed, stored from 0 to 1.' },
    'D3-ASeconds': { name: 'D3-A wallclock time', unit: 'seconds', better: 'lower' },
    'D3-BPotential': { name: 'D3-B potential gain', unit: 'score', better: 'higher' },
    'D3-BRoutability': { name: 'D3-B routability', unit: 'score', better: 'higher', note: 'Fraction of target connections successfully routed, stored from 0 to 1.' },
    'D3-BSeconds': { name: 'D3-B wallclock time', unit: 'seconds', better: 'lower' },
  },
  aliases: {'Qwen3.5-397B': 'qwen3-5-397b-a17b'},
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid).find(t => t[0][5] === 'D3-A (99 Boards)' && t[0][9] === 'D3-B (10 Boards)');
    const columns = ['CP', 'Pot.', 'Rout.', 'Time'];
    if (!table || table[0][1] !== 'D2' || ![0, 4, 8].every(i => columns.every((c, j) => table[1][i+j+1]?.startsWith(c + ' ')))) throw new Error('Missing Table 3 columns');
    const start = table.findIndex(r => r[0].includes('Inference on different LLM backbones'));
    if (start < 0) throw new Error('Missing LLM backbones section');
    const rows: LeaderboardRow[] = [];
    let rl = false;
    for (const [model, ...cells] of table.slice(start + 1)) {
      if (model.includes('RL trained on Transformer')) { rl = true; continue; }
      const values = cells.map(numberCell);
      if (values.length !== 12) throw new Error('Invalid Table 3 row: ' + model);
      const metrics: Record<string, number> = {};
      splits.forEach((split, i) => {
        const [cp, potential, routability, seconds] = values.slice(4 * i, 4 * i + 4);
        Object.assign(metrics, {[split]: cp, [split + 'Potential']: potential, [split + 'Routability']: routability, [split + 'Seconds']: seconds});
      });
      rows.push({model, score: splits.reduce((sum, split) => sum + metrics[split], 0) / 3,
        harness: rl ? undefined : 'PCBWorld LLM agent', setting: 'Best of five rollouts', metrics, ...(rl && {trials: 4})});
    }
    return checked(rows, 8);
  },
};
export default board;
