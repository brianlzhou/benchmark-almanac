// FineEnvs GeoGuesser: the article's live baseline sweep reports mean reward on its fixed 200-task evaluation.
// Reward stays on the published 0 to 1 scale. Distances and within-radius counts remain metrics.
// Provider names distinguish whole-evaluation serving configurations, including local and hosted runs.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://huggingface.co/spaces/FineEnvs/geoguesser-article/resolve/main/app/src/content/assets/data/baseline-sweep.json';
interface Entry { name: string; provider: string; reward: number; median_km: number; within25: number; within200: number; turns?: number }
const board: Leaderboard = {
  benchmark: 'geoguesser-environment-fineenvs',
  url: 'https://huggingface.co/spaces/FineEnvs/geoguesser-article', feed: FEED,
  terms: 'FineEnvs publishes this public Hugging Face Space results file, with attribution retained under the Space terms.',
  stats: {
    turns: { name: 'Turns', unit: 'count' },
    within25: { name: 'Within 25 kilometers', unit: 'count', note: 'Number of tasks with a prediction within 25 kilometers.' },
    within200: { name: 'Within 200 kilometers', unit: 'count', note: 'Number of tasks with a prediction within 200 kilometers.' },
    median_km: { name: 'Median distance in kilometers', better: 'lower' },
  },
  async fetch() {
    const source = await fetchJson<Entry[]>(FEED);
    if (!source.length || source.some(r => !r.name || !Number.isFinite(r.reward))) throw new Error('GeoGuesser reward rows missing');
    return source.map(r => ({ model: r.name, score: r.reward,
      setting: r.provider ? `provider: ${r.provider}` : undefined,
      metrics: { ...(typeof r.turns === 'number' ? { turns: r.turns } : {}), median_km: r.median_km, within25: r.within25, within200: r.within200 },
    }));
  },
};
export default board;
