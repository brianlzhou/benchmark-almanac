// MTGBench tests language models in seven multi-turn games.
// The headline is the published Total normalized score across the seven games.
// The importer reads the repository's generated summary CSV and keeps language and mode settings.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://raw.githubusercontent.com/skyberg11/MTGBench/main/analysis/outputs/tables/summary.csv';
const board: Leaderboard = {
  benchmark: 'mtgbench',
  url: 'https://github.com/skyberg11/MTGBench',
  feed: FEED,
  terms: 'Public repository results under the repository license. https://github.com/skyberg11/MTGBench',
  stats: { winRate: { name: 'Win rate', unit: 'score', better: 'higher' } },
  async fetch(): Promise<LeaderboardRow[]> {
    const lines = (await fetchText(FEED)).trim().split(/\r?\n/);
    const rows: LeaderboardRow[] = [];
    for (const line of lines.slice(1)) {
      const c = line.split(',');
      if (c.length < 11 || c[3] !== 'Total' || c[0] === 'human') continue;
      const score = Number(c[5]);
      if (!Number.isFinite(score)) throw new Error('MTGBench summary score is invalid');
      rows.push({ model: c[0], setting: `${c[1]}, ${c[2]}`, score, low: Number(c[6]), high: Number(c[7]), trials: Number(c[4]), metrics: { winRate: Number(c[8]), winRateLow: Number(c[9]), winRateHigh: Number(c[10]) } });
    }
    return checked(rows, 56);
  },
};
export default board;
