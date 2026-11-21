// AfroBench evaluates African language tasks. Its page averages dataset scores within each task, then averages the task means from its full benchmark JSON.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://mcgill-nlp.github.io/AfroBench/leaderboard_json/afrobench.json";
type Feed = Record<string, Record<string, {datasets: Record<string, Record<string, number>>}>>;
const mean = (values: number[]) => values.reduce((a, b) => a + b, 0) / values.length;

const board: Leaderboard = {
  benchmark: "afrobench",
  url: "https://mcgill-nlp.github.io/AfroBench/leaderboard.html",
  feed: FEED,
  terms: "The leaderboard page does not specify reuse terms for the score tables. https://mcgill-nlp.github.io/AfroBench/leaderboard.html",
  aliases: {"GPT-4o (Aug)":"gpt-4o-aug-2024"},
  async fetch() {
    const data = await fetchJson<Feed>(FEED);
    const scores = new Map<string, Record<string, number[]>>();
    board.parts = {};
    for (const [group, tasks] of Object.entries(data)) {
      for (const [task, { datasets }] of Object.entries(tasks)) {
        board.parts[task] = { name: task, group };
        for (const models of Object.values(datasets)) {
          for (const [model, value] of Object.entries(models)) {
            if (!Number.isFinite(value)) throw new Error('Invalid AfroBench score');
            const parts = scores.get(model) ?? {};
            (parts[task] ??= []).push(value);
            scores.set(model, parts);
          }
        }
      }
    }
    if (scores.size < 12 || Object.keys(board.parts).length < 16) throw new Error('Incomplete AfroBench matrix');
    return [...scores].map(([model, parts]) => {
      const metrics = Object.fromEntries(Object.entries(parts).map(([k, v]) => [k, mean(v)]));
      return { model, score: Number(mean(Object.values(metrics)).toFixed(1)), metrics };
    });
  },
};
export default board;
