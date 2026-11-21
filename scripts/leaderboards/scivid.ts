// SciVid evaluates video representations on animal behavior, medical tracking and weather forecasting tasks.
// The source reports no overall score, so the headline is the CalMS21 mAP column, which appears first in Table 5.
// This importer reads Table 5 and keeps the other task metrics beside each backbone result.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const URL = 'https://arxiv.org/html/2507.03578';
const board: Leaderboard = {
  benchmark: 'scivid', static: 'paper', url: URL, feed: URL, terms: PAPER_TERMS,
  headline: 'The paper reports no overall score, so this is the CalMS21 mAP column, which it lists first.',
  parts: {
    calms21: { name: 'CalMS21 mAP', group: 'Task', unit: '%' }, flyVsFly: { name: 'FlyVsFly mAP', group: 'Task', unit: '%' }, stir: { name: 'STIR accuracy', group: 'Task', unit: '%' }, digitalTyphoon: { name: 'Digital Typhoon RMSE', group: 'Task', unit: 'score', better: 'lower' }, weatherbenchZ500: { name: 'WeatherBench 2 Z500 wRMSE', group: 'Task', unit: 'score', better: 'lower' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const table = paperTables(await paperHtml(URL)).map(grid).find((rows) => rows[0]?.[0] === '' && rows[0]?.includes('CalMS21') && rows[0]?.includes('Digital Typhoon'));
    if (!table) throw new Error('SciVid backbone comparison table missing');
    const rows: LeaderboardRow[] = [];
    for (const cells of table.slice(2)) {
      const model = cells[0]?.trim();
      if (!model || model === 'Resize') continue;
      const calms21 = Number(cells[3]);
      const flyVsFly = Number(cells[4]);
      const stir = Number(cells[5]);
      const digitalTyphoon = Number(cells[6]);
      const z500 = Number(cells[7]?.split('/')[0]);
      if (![calms21, flyVsFly, stir, digitalTyphoon, z500].every(Number.isFinite)) throw new Error(`SciVid row changed: ${model}`);
      rows.push({ model, score: calms21 * 100, metrics: { calms21: calms21 * 100, flyVsFly: flyVsFly * 100, stir: stir * 100, digitalTyphoon, weatherbenchZ500: z500 } });
    }
    return checked(rows, 10);
  },
};
export default board;
