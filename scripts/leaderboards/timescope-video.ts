// TimeScope measures video understanding accuracy at multiple video durations.
// The headline score uses the board's first plotted duration, 1min, and the other durations are parts.
// The importer reads the Apache-2.0 Space's aggregated accuracy CSV.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const PAGE = 'https://huggingface.co/spaces/Apollo-LMMs/TimeScope';
const FEED = 'https://huggingface.co/spaces/Apollo-LMMs/TimeScope/raw/main/aggregated_accuracy.csv';
const board: Leaderboard = {
  benchmark: 'timescope-video', url: PAGE, feed: FEED,
  terms: 'The TimeScope Space is licensed Apache 2.0 and publishes this CSV.',
  parts: Object.fromEntries(['2min', '3min', '5min', '10min', '20min', '30min', '60min', '120min', '180min', '300min', '480min'].map((name) => [name, { name, group: 'Video duration', unit: '%' }])),
  stats: { '1min':{name:'1 minute',unit:'%',better:'higher'} },
  async fetch() {
    const rows = parseCsv(await fetchText(FEED));
    const headers = Object.keys(rows[0] ?? {});
    for (const field of ['Model', '1min', '2min', '3min', '5min', '10min', '20min', '30min', '60min', '120min', '180min', '300min', '480min']) if (!headers.includes(field)) throw new Error(`TimeScope: missing ${field}`);
    const result: LeaderboardRow[] = [];
    for (const row of rows) {
      const score = Number(row['1min']);
      if (!row.Model || !Number.isFinite(score)) continue;
      const metrics: Record<string, number> = {};
      for (const field of headers.filter((name) => name !== 'Model')) { const value = Number(row[field]); if (Number.isFinite(value)) metrics[field] = value; }
      result.push({ model: row.Model.replace('LLaMA-3.2B-11B', 'LLaMA-3.2-11B-Vision').replace('Gemini 2.5 pro', 'Gemini 2.5 Pro'), score, metrics });
    }
    if (result.length < 8) throw new Error(`TimeScope: ${result.length} rows, expected at least 8`);
    return result;
  },
};
export default board;
