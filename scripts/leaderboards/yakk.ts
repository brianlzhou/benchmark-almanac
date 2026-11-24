// YAKK tests GPU kernel optimization against compiled JAX. A rejected kernel earns zero.
// The appendix ranks mean speedup across the ten tested tasks with five GPU checks per episode.
import type { Leaderboard } from './types.ts';
import { tables } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://www.hud.ai/research/yet-another-kernel-kernel';
const board: Leaderboard = {
  benchmark: 'yakk',
  url,
  feed: url,
  terms: 'HUD publishes the appendix under its site terms. https://www.hud.ai/terms-of-service',
  headline: 'Mean speedup over compiled JAX on the ten evaluated tasks, with five GPU checks per episode.',
  stats: { rejected: { name: 'Rejected final kernels', unit: '%', better: 'lower', note: 'Excludes kernels the model left unmodified.' } },
  async fetch() {
    const table = tables(await fetchText(url)).find(t =>
      t[0]?.map(c => c.text).join('|') === 'Rank|Model|Reasoning setting|Mean speedup|Rejected');
    if (!table) throw new Error('Missing YAKK appendix ranking or columns');
    return checked(table.slice(1).map((row, i) => {
      const [rank, model, effort, speedup, rejected] = row.map(c => c.text);
      if (row.length !== 5 || Number(rank) !== i + 1 || !model || !effort ||
          !/^\d+(?:\.\d+)?×$/.test(speedup) || !/^\d+(?:\.\d+)?%$/.test(rejected)) {
        throw new Error('Invalid YAKK appendix row ' + (i + 1));
      }
      return { model, setting: effort + ' reasoning, 5 GPU checks', score: parseFloat(speedup),
        trials: 1, metrics: { rejected: parseFloat(rejected) } };
    }), 60);
  },
};
export default board;
