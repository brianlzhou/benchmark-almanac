// HandWorldBench ranks hand-centric video models by overall HWBScore. The results JSON also contains three embodiment tables and six scoring dimensions.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const url = "https://embodiedcity.github.io/HandWorldBench/#results";
const feed = "https://embodiedcity.github.io/HandWorldBench/assets/results.json";

const board: Leaderboard = {
  benchmark: 'handworldbench', url, feed,
  terms: "The authors do not specify separate terms for leaderboard scores on https://embodiedcity.github.io/HandWorldBench/#results" ,
  stats: Object.fromEntries(['Ego','Simulated hands','Real robot'].flatMap(group => ['Visual quality','Hand fidelity','Appearance consistency','Instruction following','Physical consistency','Temporal coherence'].map(d => [`${group} · ${d}`, { name: `${group} ${d}`, unit: 'score', better: 'higher' }]))),
  async fetch() {
    type Entry = { name: string; score: number; dimensions: number[] };
    const data = await fetchJson<Record<string, Entry[]>>(feed);
    const splits: Record<string, string> = {human: 'Ego', handson: 'Simulated hands', real_robot: 'Real robot'};
    const dimensions = ['Visual quality','Hand fidelity','Appearance consistency','Instruction following','Physical consistency','Temporal coherence'];
    board.parts = { ...splits, ...Object.fromEntries(dimensions.map(d => [d,d])) };
    if (data.all.length < 11) throw new Error('Incomplete overall table');
    return data.all.map(r => {
      const metrics: Record<string, number> = {};
      for (const key of ['all', ...Object.keys(splits)]) {
        const entry = key === 'all' ? r : data[key]?.find(e => e.name === r.name);
        if (!entry || !Number.isFinite(entry.score) || entry.dimensions.length !== 6 || !entry.dimensions.every(Number.isFinite)) throw new Error('Missing scores for ' + r.name);
        if (key !== 'all') metrics[key] = entry.score;
        dimensions.forEach((d,i) => { metrics[key === 'all' ? d : splits[key] + ' · ' + d] = entry.dimensions[i]; });
      }
      return { model: r.name, score: r.score, metrics };
    });
  },
};
export default board;
