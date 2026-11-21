// BLiMP-NL tests Dutch linguistic acceptability with minimal pairs.
// EuroEval publishes Dutch CoLA accuracy for each evaluated language model.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://euroeval.com/leaderboards-csv/dutch_all_models.csv';
const board: Leaderboard = {
  benchmark: 'blimp-nl', host: 'EuroEval', url: 'https://euroeval.com/datasets/dutch', feed,
  terms: 'EuroEval publishes its leaderboard for public use. https://euroeval.com/',
  async fetch() {
    const raw = await fetchText(feed);
    const csv = raw.slice(raw.indexOf('Rank,Model'));
    const rows = parseCsv(csv);
    const col = Object.keys(rows[0] ?? {}).find(key => key.includes('dutch_cola'));
    if (!col) throw new Error('Dutch CoLA column missing');
    const out: LeaderboardRow[] = [];
    for (const row of rows) {
      const model = row.Model?.replace(/<[^>]+>/g, '').trim();
      const value = row[col]?.split('/')[0]?.match(/[0-9.]+/)?.[0];
      if (!model || !value) continue;
      out.push({ model, score: Number(value), setting: 'Dutch CoLA test split' });
    }
    if (out.length < 2) throw new Error('No Dutch CoLA model rows');
    return checked(out, out.length);
  },
};
export default board;
