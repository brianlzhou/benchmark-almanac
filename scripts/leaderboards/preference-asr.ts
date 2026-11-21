// Preference-ASR tests speech recognition with normalization preferences.
// Table 2 reports overall word error rate for four models under standard and preference-aware scoring.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://arxiv.org/html/2606.29534';
const board: Leaderboard = {
  benchmark: 'preference-asr', static: 'paper', url: feed, feed,
  terms: 'The authors publish the results in the arXiv paper. https://arxiv.org/abs/2606.29534',
  parts: { standard: 'Standard WER', preference: 'Preference-aware WER' },
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid).find(t => t[0]?.join('|') === 'Model|WER Eval|Normalization|Normalization|Entities|Entities|Disfluencies|Disfluencies|Case|Case|Standard|Standard|Overall|Overall');
    if (!table) throw new Error('Preference-ASR results table missing');
    const rows: LeaderboardRow[] = [];
    for (const row of table.slice(2)) {
      if (row.length !== 14 || !/^\d+(?:\.\d+)?$/.test(row[12])) throw new Error('Invalid Preference-ASR row');
      const model = row[0].replace(/ \[.*$/, '');
      const metrics: Record<string, number> = { standard: Number(row[10]), preference: Number(row[12]) };
      if (/^\d+(?:\.\d+)?$/.test(row[13])) metrics.overallInstruction = Number(row[13]);
      rows.push({ model, setting: row[1] === 'Std' ? 'Standard' : 'Preference-aware', score: Number(row[12]), metrics });
    }
    return checked(rows, 8);
  },
};
export default board;
