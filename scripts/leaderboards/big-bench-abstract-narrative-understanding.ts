// ADAGE evaluates the five-choice BIG-bench proverb task. The ePiC summary JSON ranks models by accuracy on 1,000 stories.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
interface Entry { model: string; epic_accuracy: number; epic_n_items: number; epic_n_invalid: number; epic_normalized: number }

const feed = "https://raw.githubusercontent.com/AhmedHajAhmed/adage-benchmark/main/results_epic/summary.json";
const board: Leaderboard = {
  benchmark: 'big-bench-abstract-narrative-understanding',
  url: "https://github.com/AhmedHajAhmed/adage-benchmark/blob/main/results_epic/summary.json",
  feed,
  terms: "The raw file host has no robots.txt. The ADAGE repository includes an MIT license. The source task retains its own terms. https://github.com/AhmedHajAhmed/adage-benchmark/blob/main/LICENSE",
  host: 'ADAGE',
  stats: { items: { name: 'Items', unit: 'count' }, invalid: { name: 'Invalid responses', unit: 'count', better: 'lower' }, normalized: { name: 'Normalized score', unit: 'score', better: 'higher' } },
  async fetch() {
    const { leaderboard } = await fetchJson<{leaderboard: Entry[]}>(feed);
    if (leaderboard.length < 8) throw new Error('Incomplete ePiC leaderboard');
    return leaderboard.map(r => {
      if (!r.model || ![r.epic_accuracy, r.epic_n_items, r.epic_n_invalid, r.epic_normalized].every(Number.isFinite))
        throw new Error('Incomplete ePiC result');
      return { model: r.model, setting: 'Five choices', score: 100 * r.epic_accuracy,
        metrics: { items: r.epic_n_items, invalid: r.epic_n_invalid, normalized: r.epic_normalized } };
    });
  },
};
export default board;
