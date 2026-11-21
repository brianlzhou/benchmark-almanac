// TCSExam evaluates theorem proving, solver use, construction, and open-ended tasks.
// The headline score is the published index on a 0 to 100 scale.
// The importer reads the public full-index JSON file.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const PAGE = 'https://moonshotai.github.io/TCSExam/#full';
const FEED = 'https://moonshotai.github.io/TCSExam/data/full-index.json';
interface Entry { model_label?: string; index?: number; theorem?: number; solver?: number; construction?: number; open?: number }
const board: Leaderboard = {
  benchmark: 'tcsexam', url: PAGE, feed: FEED,
  terms: 'The TCSExam site is CC BY 4.0, including its published score table.',
  parts: { theorem: { name: 'Theorem', group: 'Task' }, solver: { name: 'Solver', group: 'Task' }, construction: { name: 'Construction', group: 'Task' }, open: { name: 'Open', group: 'Task' } },
  async fetch() {
    const data = await fetchJson<{ models?: Entry[] }>(FEED);
    const rows = (data.models ?? []).filter((entry) => entry.model_label && typeof entry.index === 'number').map((entry) => {
      const metrics: Record<string, number> = {};
      for (const key of ['theorem', 'solver', 'construction', 'open'] as const) if (typeof entry[key] === 'number') metrics[key] = entry[key] * 100;
      return { model: entry.model_label!, score: entry.index!, metrics } satisfies LeaderboardRow;
    });
    if (rows.length < 5) throw new Error(`TCSExam: ${rows.length} rows, expected at least 5`);
    return rows;
  },
};
export default board;
