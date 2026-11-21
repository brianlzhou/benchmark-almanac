// Polaris-Bench tests multimodal models on paired Cartesian and Polar visual reasoning layouts.
// The headline is the site's overall Polar accuracy in percent, and Cartesian accuracy is a metric.
// This importer reads the leaderboard model array embedded in the official page.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://google-deepmind.github.io/polaris-bench/';
const board: Leaderboard = {
  benchmark: 'polaris-bench',
  url: `${PAGE}#leaderboard`,
  feed: `${PAGE} (embedded leaderboard model array)`,
  terms: 'The page licenses the data under CC-BY-4.0 and the code under Apache-2.0. Results are credited to Google DeepMind.',
  parts: {
    cartesian: { name: 'Cartesian', group: 'Layout', note: 'Accuracy on the Cartesian layout.', unit: '%' },
    polar: { name: 'Polar', group: 'Layout', note: 'Accuracy on the Polar layout.', unit: '%' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const html = await fetchText(PAGE);
    const match = html.match(/const models = \[(.*?)\n    \];/s);
    if (!match) throw new Error('Polaris-Bench: embedded models array missing');
    const rows: LeaderboardRow[] = [];
    for (const line of match[1].matchAll(/\["([^"]+)"\s*,\s*"([^"]+)"\s*,([\s\d.,-]+)\],/g)) {
      const values = line[3].split(',').map((x) => Number(x.trim()));
      if (values.length !== 12 || values.some((x) => !Number.isFinite(x))) throw new Error(`Polaris-Bench: malformed row for ${line[1]}`);
      rows.push({ model: line[1], score: values[11], metrics: { cartesian: values[10], polar: values[11] }, open: line[2] === 'Open' });
    }
    if (rows.length !== 14) throw new Error(`Polaris-Bench: ${rows.length} rows, expected 14`);
    return rows;
  },
};
export default board;
