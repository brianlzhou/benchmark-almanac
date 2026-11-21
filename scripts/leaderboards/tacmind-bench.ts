// TacMind tests tactile robot manipulation. The board sorts its public results by average out-of-distribution success rate.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://tacmind-bench.github.io/content/leaderboard.json";
const columns = ['Precise', 'Recognition', 'Dynamic'].flatMap(suite =>
  ['InD', 'Light', 'Cam', 'Size'].map(condition => suite + ' ' + condition)).concat('Avg InD');

const board: Leaderboard = {
  benchmark: "tacmind-bench",
  url: "https://tacmind-bench.github.io/#leaderboard",
  feed: FEED,
  terms: "The authors do not specify separate terms for leaderboard scores on https://tacmind-bench.github.io/#leaderboard",
  parts: Object.fromEntries(columns.map(k => [k, k])),
  async fetch() {
    const entries = await fetchJson<{ model: string; scores: number[]; single_task?: boolean }[]>(FEED);
    if (entries.length < 6) throw new Error('Incomplete TacMind board');
    return entries.map(({ model, scores, single_task }) => {
      if (!model || scores.length !== 14 || !scores.every(Number.isFinite)) throw new Error('Invalid TacMind row');
      return { model, score: scores[13], setting: single_task ? 'Single-task' : undefined,
        metrics: Object.fromEntries(columns.map((k, i) => [k, scores[i]])) };
    });
  },
};
export default board;
