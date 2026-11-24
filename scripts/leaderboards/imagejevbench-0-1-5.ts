// ImageJevBench v0.1.5 ranks systems on the all-track composite across public and sealed images.
// The frozen preview JSON also scores the core and everyday photo tracks.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const url = "https://benchmarkheaven.com/image-jev-bench#imagejev-v015-archive";
const feed = "https://raw.githubusercontent.com/fstandhartinger/model-market-comparison/main/data/raw/benchmarks/jevbench/multimodal-preview/preview.json";
type Track = { composite: {score: number}, public: {accuracy: number}, sealed: {accuracy: number}, axes: Record<string, number>,
  cost: {usd_per_1000: number}, speed: {adjusted_p50_s: number, adjusted_p95_s: number}, matched_gap_pp: number };
type Result = { name: string, score: number, inference_setting?: string, tracks: Record<'all' | 'core' | 'everyday_photo', Track> };
const board: Leaderboard = {
  benchmark: 'imagejevbench-0-1-5', url, feed,
  terms: "Benchmark Heaven allows the archive page in robots.txt. The raw host gives no robots rules. The CC BY 4.0 export notice does not name this archive.",
  aliases: { 'GPT-6 Luna (low reasoning effort)': 'gpt-6-luna' },
  parts: { core: 'Core', everyday_photo: 'Everyday photo', publicAccuracy: {name: 'Public accuracy', unit: '%'},
    sealedAccuracy: {name: 'Sealed accuracy', unit: '%'} },
  stats: {
    matchedGap: { name: 'Matched gap', unit: 'score', better: 'lower' },
    medianLatency: { name: 'Median latency', unit: 'seconds', better: 'lower' },
    p95Latency: { name: '95th percentile latency', unit: 'seconds', better: 'lower' },
    intelligence: { name: 'Intelligence', unit: 'score', better: 'higher' }, calibration: { name: 'Calibration', unit: 'score', better: 'higher' }, speed: { name: 'Speed', unit: 'score', better: 'higher' }, cost: { name: 'Cost axis', unit: 'score', better: 'higher' },
  },
  async fetch() {
    const d = await fetchJson<{ revision: string, n_systems: number, ranking: Result[] }>(feed);
    if (d.revision !== 'v0.1.5' || d.ranking.length !== d.n_systems || d.n_systems < 50) throw new Error('Invalid v0.1.5 ranking');
    return d.ranking.map(r => {
      const { all, core, everyday_photo } = r.tracks;
      const score = all.composite.score;
      if (!r.name || !Number.isFinite(score) || score !== r.score) throw new Error('Invalid all-track composite');
      return { model: r.name, setting: r.inference_setting || undefined, score, cost: all.cost.usd_per_1000 / 1000,
        metrics: { ...all.axes, core: core.composite.score, everyday_photo: everyday_photo.composite.score,
          publicAccuracy: all.public.accuracy * 100, sealedAccuracy: all.sealed.accuracy * 100, matchedGap: all.matched_gap_pp,
          medianLatency: all.speed.adjusted_p50_s, p95Latency: all.speed.adjusted_p95_s } };
    });
  },
};
export default board;
