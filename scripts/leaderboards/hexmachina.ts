// HexMachina evaluates model-written Catan players against an alpha-beta opponent.
// Table 2 reports win rate with an interval and victory points with uncertainty.
// The paper identifies the orchestrator, coder and support models used to produce each evolved player.
import type { Leaderboard } from './types.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/html/2506.04651';
const models: Record<string, string> = { GPT: 'GPT-5-mini', Claude: 'Claude 3.7 Sonnet', Mistral: 'Mistral-large (snapshot unspecified)' };
const board: Leaderboard = {
  benchmark: 'hexmachina', static: 'paper', url: feed, feed, harnesses: 'system',
  terms: 'The authors publish their results under the paper terms at https://arxiv.org/abs/2506.04651.',
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid).find(t => t[0].join('|') === 'Player|Model|Win Rate|Victory Points');
    if (!table) throw new Error('Missing Catan player results');
    return checked(table.slice(1).filter(r => r[1] !== 'X').map(([harness, name, rate, points]) => {
      const model = models[name];
      const win = rate.match(/^([\d.]+)%\s*\[([\d.]+)%,\s*([\d.]+)%\]$/);
      const vp = points.split('\\pm').map(v => numberCell(v.trim()));
      if (!model || !win || vp.length !== 2) throw new Error('Unrecognized Catan model or result');
      const evolved = harness === 'HexMachina';
      return { model, harness, score: numberCell(win[1]), low: numberCell(win[2]), high: numberCell(win[3]),
        models: evolved ? [...new Set([model, models.GPT, models.Mistral])] : undefined, trials: evolved ? 10 : 20,
        metrics: { victoryPoints: vp[0], victoryPointsUncertainty: vp[1], games: evolved ? 1000 : 20 } };
    }), 4);
  },
};
export default board;
