// Hedge Gym tests option hedging on real 2020 and 2022 crash windows.
// The source reports no overall score. The headline is the plain mean of the two crisis losses.
// The importer reads the results tables in the project's README.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://raw.githubusercontent.com/giack-hack/synthetic-markets-transfer/main/README.md';
const board: Leaderboard = {
  benchmark: 'hedge-gym',
  url: 'https://github.com/giack-hack/synthetic-markets-transfer',
  feed: FEED,
  terms: 'The project README is public under the MIT license. https://github.com/giack-hack/synthetic-markets-transfer/blob/main/LICENSE',
  parts: {
    crisis2020: { name: '2020 crisis', group: 'Real crisis', better: 'lower' },
    crisis2022: { name: '2022 crisis', group: 'Real crisis', better: 'lower' },
  },
  headline: 'The paper reports no overall score, so this is the plain mean of its 2020 and 2022 crisis losses.',
  async fetch(): Promise<LeaderboardRow[]> {
    const s = await fetchText(FEED);
    const small = s.match(/\| 2020 \| 0\.0352 \| 0\.0173 \|[\s\S]*?\| 2022 \| 0\.0281 \| 0\.0144 \|/);
    const large = s.match(/\| 2020 \| 0\.0263 \| 0\.0219 \|[\s\S]*?\| 2022 \| 0\.0232 \| 0\.0189 \|/);
    if (!small || !large) throw new Error('Hedge Gym README results tables changed');
    const rows: LeaderboardRow[] = [
      { model: 'Qwen3-1.7B', setting: 'untrained', score: (0.0352 + 0.0281) / 2, metrics: { crisis2020: 0.0352, crisis2022: 0.0281 } },
      { model: 'Qwen3-1.7B', setting: 'trained in synthetic worlds', score: (0.0173 + 0.0144) / 2, metrics: { crisis2020: 0.0173, crisis2022: 0.0144 } },
      { model: 'Qwen3-4B', setting: 'untrained', score: (0.0263 + 0.0232) / 2, metrics: { crisis2020: 0.0263, crisis2022: 0.0232 } },
      { model: 'Qwen3-4B', setting: 'trained in synthetic worlds', score: (0.0219 + 0.0189) / 2, metrics: { crisis2020: 0.0219, crisis2022: 0.0189 } },
    ];
    return checked(rows, 4);
  },
};
export default board;
