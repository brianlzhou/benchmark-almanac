// SycoBench-600 tests baseline accuracy, resistance to misleading pressure, and correction selectivity.
// The headline score is baseline accuracy on the common 555-question intersection.
// The authors publish the results table in the repository README.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
const FEED = 'https://raw.githubusercontent.com/debu-sinha/sycobench-600/main/README.md';
const board: Leaderboard = {
  benchmark: 'sycobench-600', url: 'https://github.com/debu-sinha/sycobench-600', feed: FEED,
  stats: { PRA_all: { name: 'Precision-recall area', unit: 'score', better: 'higher' }, Sel: { name: 'Selection rate', unit: 'score', better: 'higher' }, Stub_nc: { name: 'Non-compliant stub rate', unit: 'score', better: 'higher' }, Syco: { name: 'Sycophancy rate', unit: 'score', better: 'lower' } },
  terms: 'The repository is public under its stated license. Source attribution applies.',
  async fetch(): Promise<LeaderboardRow[]> {
    const text = await fetchText(FEED); const section = text.split('| Model | Acc |')[1]?.split('Definitions:')[0];
    if (!section) throw new Error('SycoBench results table missing');
    const rows: LeaderboardRow[] = [];
    for (const line of section.split(/\r?\n/)) {
      const c = line.split('|').map(x => x.trim()).filter(Boolean); if (c.length !== 6 || c[0].startsWith('-')) continue;
      const nums = [c[1], c[2], c[3], c[4], c[5]].map(x => Number(x.split(' ')[0])); if (nums.some(n => !Number.isFinite(n))) continue;
      rows.push({ model: c[0], score: nums[0], metrics: { PRA_all: nums[1], Syco: nums[2], Stub_nc: nums[3], Sel: nums[4] } });
    }
    if (rows.length !== 7) throw new Error(`Expected seven SycoBench rows, got ${rows.length}`); return rows;
  },
};
export default board;
