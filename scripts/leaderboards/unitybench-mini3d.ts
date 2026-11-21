// UnityBench-Mini3D ranks agents by the percentage of available milestone credit earned.
// The project page publishes overall, difficulty and category scores in its results download.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://unitybench.github.io/unitybench-mini3d/assets/results.json";

const board: Leaderboard = {
  benchmark: "unitybench-mini3d",
  url: "https://unitybench.github.io/unitybench-mini3d/#results",
  feed: FEED,
  terms: "Unity reports 36 model and harness combinations. The project page and repository do not state score reuse terms. https://github.com/Unity-China/UnityBench-Mini3D The robots URL returns HTML.",
  stats: { minutesPerTask: { name: 'Minutes per task', unit: 'minutes', better: 'lower' } },
  parts: { ui: 'User interface', animation: 'Animation', editor: 'Editor operations', scene: 'Scene construction',
    vfx: 'Particles & shaders', physics: 'Physics', misc: 'Miscellaneous', easy: 'Easy', medium: 'Medium', hard: 'Hard' },
  async fetch() {
    const results = await fetchJson<Array<Record<string, string | number | null>>>(FEED);
    if (results.length < 36) throw new Error('Missing UnityBench configurations');
    return results.map(row => {
      const metrics: Record<string, number> = {};
      for (const key of Object.keys(board.parts!)) {
        if (typeof row[key] !== 'number') throw new Error('Missing UnityBench category: ' + key);
        metrics[key] = row[key];
      }
      if (!row.model || !row.harness || typeof row.overall !== 'number' || typeof row.time !== 'number' || !('cost' in row))
        throw new Error('Incomplete UnityBench result');
      metrics.minutesPerTask = row.time;
      return { model: String(row.model), harness: String(row.harness), score: row.overall, metrics,
        cost: typeof row.cost === 'number' ? row.cost : undefined };
    });
  },
};
export default board;
