// Sparse Fourier Recovery scores signal reconstructions by mean reward across seeds.
// The official Gradio overview reads the combined trial CSV and keeps the last valid turn of each seed.
import type { Leaderboard } from './types.ts';
import { parseCsv, fetchText } from '../lib/util.ts';

const url = 'https://huggingface.co/spaces/verifiablelabs/scientific-rl-benchmark';
const feed = url + '/raw/main/data/llm_benchmark_all.csv';
const board: Leaderboard = {
  benchmark: 'sparse-fourier-recovery', url, feed,
  terms: 'Public trial results included in Verifiable Labs’ Scientific RL leaderboard Space.',
  async fetch() {
    const models = new Map<string, Map<string, Record<string, string>>>();
    for (const r of parseCsv(await fetchText(feed))) {
      if (r.env !== 'sparse-fourier-recovery' || r.parse_ok !== 'True') continue;
      if (!r.model || !r.seed || !r.reward || !Number.isFinite(Number(r.reward))) throw new Error('Missing sparse Fourier trial');
      const seeds = models.get(r.model) ?? new Map<string, Record<string, string>>();
      const prev = seeds.get(r.seed);
      if (!prev || Number(r.turn) > Number(prev.turn)) seeds.set(r.seed, r);
      models.set(r.model, seeds);
    }
    if (models.size < 5) throw new Error('Incomplete sparse Fourier model results');
    return [...models].map(([name, seeds]) => {
      const trials = [...seeds.values()];
      const mean = (k: string) => trials.reduce((s, r) => {
        if (!r[k] || !Number.isFinite(Number(r[k]))) throw new Error('Missing sparse Fourier ' + k);
        return s + Number(r[k]);
      }, 0) / trials.length;
      return { model: name.split('/').at(-1)!, score: Number(mean('reward').toFixed(3)), trials: trials.length,
        cost: mean('usd_cost') };
    });
  },
};
export default board;
