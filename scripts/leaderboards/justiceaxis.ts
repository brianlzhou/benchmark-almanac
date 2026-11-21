// JusticeAxis tests legal judgments against case facts, statutes and precedents.
// Table 2 gives the mean of exact charge, charge family, disposition and sentence accuracy on 128 cases.
// The Wilson 95% half-widths apply to charge accuracy, recorded placement and polarity.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/html/2610.00353';
const keys = ['charge', 'family', 'disposition', 'sentence', 'average', 'chargeGivenFamily', 'sentenceGivenDisposition',
  'recorded', 'rigid', 'ungrounded', 'miss', 'polarity', 'chargeGain', 'sentenceGain', 'recordedGain', 'relativeMissReduction'];
const board: Leaderboard = {
  benchmark: 'justiceaxis', url: feed, feed, static: 'paper', harnesses: 'system',
  terms: 'The paper publishes Table 2 at https://arxiv.org/abs/2610.00353.',
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid).find(t => t[1]?.slice(0, 8).join('|') === 'Model|Acc|Fam|Disp|Sent.|Avg|Acc/Fam|Sent/Disp');
    if (!table || table[1][12] !== 'Pol.' || table[1][16] !== 'RMR') throw new Error('Missing JusticeAxis Table 2');
    let backbone = '';
    const rows: LeaderboardRow[] = [];
    for (const cells of table.slice(2)) {
      if (cells.every(c => c === cells[0])) {
        backbone = cells[0].match(/Peer frameworks on (.+)$/)?.[1] ?? '';
        continue;
      }
      if (cells.length !== 17) throw new Error('JusticeAxis columns changed');
      const name = cells[0].replace(/\s*(?:†|\[\s*\d+\s*\]|\(ours\))$/, '').trim();
      const metrics: Record<string, number> = {};
      keys.forEach((key, i) => {
        if (cells[i + 1] === '–') return;
        const [value, halfWidth] = cells[i + 1].split('\\pm').map(c => numberCell(c.trim()));
        metrics[key] = value;
        if (halfWidth !== undefined) metrics[key + 'Wilson95HalfWidth'] = halfWidth;
      });
      const prompt = backbone && name === 'Syllogism prompting';
      rows.push({ model: backbone || name, score: metrics.average, metrics,
        ...(backbone ? (prompt ? { setting: name } : { harness: name }) : {}) });
    }
    return checked(rows, 14);
  },
};
export default board;
