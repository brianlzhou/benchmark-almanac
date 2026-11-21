// ANIMA evaluates reasoning about animal welfare. CompassionBench publishes overall mean scores on a 0 to 100 scale.
// Its AHB endpoints retain the benchmark's former name and publish uncertainty, epochs and all 13 dimension scores.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const url = 'https://compassionbench.com';
const feed = url + '/api/overall-scores';
interface Run { name: string; modelId: string; score: number; ciLow: number; ciHigh: number; epochs: number; createdAt: string }
interface Dimensions { dimensions: string[]; radarData: Array<{subject: string} & Record<string, unknown>> }
const board: Leaderboard = {
  benchmark: 'anima', url, feed,
  terms: 'The benchmark authors publish aggregate results on https://compassionbench.com/ and gate access to the questions.',
  async fetch() {
    const runs = await fetchJson<Run[]>(feed);
    await new Promise(resolve => setTimeout(resolve, 1000));
    const dims = await fetchJson<Dimensions>(url + '/api/dimension-scores');
    if (dims.dimensions.length !== 13 || dims.radarData.length !== dims.dimensions.length) throw new Error('Missing ANIMA dimensions');
    const parts: Record<string, string> = {};
    const rows = runs.map(r => {
      const metrics: Record<string, number> = {};
      for (const d of dims.radarData) {
        const key = d.subject.replace(/[^a-zA-Z0-9]/g, '');
        const v = d[r.name];
        if (!dims.dimensions.includes(d.subject) || typeof v !== 'number' || !Number.isFinite(v)) throw new Error('Missing dimension for ' + r.name);
        parts[key] = d.subject;
        metrics[key] = v;
      }
      if (![r.score, r.ciLow, r.ciHigh, r.epochs].every(Number.isFinite)) throw new Error('Missing ANIMA score or interval');
      return { model: r.name, score: r.score, low: r.ciLow, high: r.ciHigh, trials: r.epochs, date: r.createdAt.slice(0, 10), metrics };
    });
    board.parts = parts;
    return checked(rows, 16);
  },
};
export default board;
