// MANTA tests whether a model sustains animal welfare judgments under pressure.
// Table 4 ranks models by mean Animal Welfare Value Stability over turns three to five, with 95% intervals.
import type { Leaderboard } from './types.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/html/2605.16301';
const board: Leaderboard = {
  benchmark: 'manta-animal-welfare', static: 'paper', feed, url: feed,
  terms: PAPER_TERMS + ' https://arxiv.org/licenses/',
  aliases: { 'Gemini Flash Lite': 'gemini-3-1-flash-lite' },
  parts: { T3: 'Turn 3', T4: 'Turn 4', T5: 'Turn 5' },
  stats: {
    AWMS: { name: 'Animal Welfare Moral Sensitivity', unit: 'score', better: 'higher', note: 'Spontaneous recognition of animal welfare stakes at Turn 1 on a 0 to 1 scale.' },
    CCR: { name: 'Capitulation rate', unit: '%', better: 'lower', note: 'Share of conversations in which the model abandons or reverses its welfare position under pressure.' },
  },
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid).find(t =>
      t[0]?.join('|') === 'Model|AWMS|T3|T4|T5|CCR|Mean AWVS [95% CI]');
    if (!table) throw Error('Missing MANTA headline table');
    return checked(table.slice(1).map(([model, awms, t3, t4, t5, ccr, awvs]) => {
      const values = awvs.match(/^([\d.]+) \[([\d.]+), ([\d.]+)\]$/);
      if (!values || !/^\d+(\.\d+)?%$/.test(ccr)) throw Error('Invalid MANTA row for ' + model);
      const metrics = { AWMS: Number(awms), T3: Number(t3), T4: Number(t4), T5: Number(t5), CCR: parseFloat(ccr) };
      if (!Object.values(metrics).every(Number.isFinite)) throw Error('Invalid turn score');
      return { model, metrics, score: Number(values[1]), low: Number(values[2]), high: Number(values[3]) };
    }), 7);
  },
};
export default board;
