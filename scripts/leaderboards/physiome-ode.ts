// Physiome-ODE tests forecasting on 50 irregularly sampled biological time series.
// Each dataset is one match between every pair of models. The lower mean squared error wins.
// Its All IMTS models ranking fits Bradley-Terry strengths with one virtual tie per pair.
// GRU-ODE-Bayes anchors Elo at 1000. The board bootstraps datasets 300 times for the 95% interval.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://kloetergensc.github.io/Physiome-ODE/data/results.json';
interface Dataset { id: string; model: string; res: Record<string, [number, number]> }
function ratings(errors: number[][], count: number, anchor: number) {
  const wins = Array<number>(count).fill((count - 1) / 2);
  for (const row of errors) {
    for (let i = 0; i < count; i++) {
      for (let j = 0; j < i; j++) {
        const win = row[i] < row[j] ? 1 : row[i] === row[j] ? 0.5 : 0;
        wins[i] += win;
        wins[j] += 1 - win;
      }
    }
  }
  let p = Array<number>(count).fill(1);
  for (let iter = 0; iter < 500; iter++) {
    const q = wins.map((w, i) => w / p.reduce((sum, v, j) => sum + (i === j ? 0 : (errors.length + 1) / (p[i] + v)), 0));
    const norm = Math.exp(q.reduce((sum, v) => sum + Math.log(v), 0) / count);
    const next = q.map(v => v / norm);
    const delta = Math.max(...next.map((v, i) => Math.abs(v - p[i])));
    p = next;
    if (delta < 1e-10) break;
  }
  return p.map(v => 1000 + 400 * Math.log10(v / p[anchor]));
}
const board: Leaderboard = {
  benchmark: 'physiome-ode', url: 'https://kloetergensc.github.io/Physiome-ODE/', feed,
  terms: 'The project uses Apache-2.0 at https://github.com/kloetergensc/Physiome-ODE/blob/main/LICENSE.',
  headline: 'The leaderboard ranks all IMTS models by Elo from pairwise comparisons of forecast error. Higher Elo is better.',
  stats: {
    wins: { name: 'Datasets won', unit: 'count', better: 'higher' },
    improvability: { name: 'Improvability', unit: '%', better: 'lower' },
  },
  async fetch() {
    const data = await fetchJson<{models: {name: string}[]; datasets: Dataset[]; anchor: string}>(feed);
    const names = data.models.map(m => m.name);
    const anchor = names.indexOf(data.anchor);
    if (anchor < 0 || data.datasets.length !== 50 || new Set(data.datasets.map(d => d.id)).size !== 50) throw new Error('Dataset list or anchor changed');
    const errors = data.datasets.map(d => names.map(n => {
      const pair = d.res[n];
      if (!pair || pair.length !== 2 || !pair.every(Number.isFinite)) throw new Error('Missing forecast error or deviation');
      return pair[0];
    }));
    const elo = ratings(errors, names.length, anchor);
    let seed = errors.reduce((h, _, i) => (Math.imul(h, 31) + i + 1) | 0, 2025);
    function randomIndex() {
      seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return Math.floor(((t ^ t >>> 14) >>> 0) / 4294967296 * errors.length);
    }
    const bootstrap = Array.from({length: 300}, () => ratings(errors.map(() => errors[randomIndex()]), names.length, anchor));
    board.parts = Object.fromEntries(data.datasets.map(d => [d.id, {name: d.id + ' (' + d.model + ')', better: 'lower' as const, unit: 'score' as const}]));
    const rows = names.map((model, i) => {
      const sampled = bootstrap.map(b => b[i]).sort((a, b) => a - b);
      const metrics: Record<string, number> = { wins: 0, improvability: 0 };
      data.datasets.forEach((d, j) => {
        const [mse, std] = d.res[model];
        metrics[d.id] = mse;
        metrics[d.id + 'Std'] = std;
        const best = Math.min(...errors[j]);
        if (mse === best) metrics.wins++;
        metrics.improvability += 100 * (mse - best) / mse / errors.length;
      });
      return {model, score: elo[i], low: sampled[7], high: sampled[292], setting: 'All IMTS models', metrics};
    });
    return checked(rows, 10);
  },
};
export default board;
