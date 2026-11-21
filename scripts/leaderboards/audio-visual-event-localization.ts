// AVE measures how accurately models localize an audio-visual event in video segments.
// Tables 1 and 2 report test accuracy for supervised and weakly supervised models and feature fusion variants.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/1803.08842';
export default {
  benchmark: 'audio-visual-event-localization', url: feed, feed, static: 'paper',
  terms: 'The paper and license are linked at https://arxiv.org/abs/1803.08842',
  async fetch() {
    const ts = paperTables(await paperHtml(feed)).map(grid);
    const inputs = ts.find(g => g[0].includes('W-A+V-att'));
    const fusion = ts.find(g => g[0].includes('DMRFE') && g[0].includes('DMRN'));
    if (!inputs || inputs[1][0] !== 'Accuracy' || !fusion) throw new Error('Missing AVE accuracy tables');
    const rows: LeaderboardRow[] = [];
    for (const [i,name] of inputs[0].slice(1).entries()) {
      const weak = name.startsWith('W-');
      rows.push({ model: name.replace(/^W-/,''), setting: weak ? 'Weakly supervised' : 'Supervised',
        score: numberCell(inputs[1][i+1]) });
    }
    for (const [setting,...cells] of fusion.slice(1)) {
      for (const [i,cell] of cells.entries()) {
        const model = fusion[0][i+1];
        if (cell === '-') continue;
        // Table 1 already includes the supervised attended A+V model with late concatenation.
        if (setting === 'Late Fusion' && model === 'Concat') continue;
        rows.push({ model, setting, score: numberCell(cell) });
      }
    }
    return checked(rows,37);
  },
} satisfies Leaderboard;
