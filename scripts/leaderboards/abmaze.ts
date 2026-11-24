// AbMaze tests model decisions in a budgeted antibody optimization simulation.
// The results chart gives mean normalized improvement on a zero-to-one scale.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://valenlabs.com/abmaze/results/index.html';
const feed = new URL('results1.js', url).href;
interface Result {
  label: string; baseline: boolean; score: number; ci: number[]; n: number; usd: number;
  by_task: Record<string, [number, number[], number]>;
}
const board: Leaderboard = {
  benchmark: 'abmaze', url, feed,
  aliases: { 'Gemini 4': 'gemini-4-argon' },
  terms: 'Valen publishes these results at https://valenlabs.com/blog/abmaze.',
  async fetch() {
    const source = await fetchText(feed);
    const data = source.match(/^\s*const D=(\{[^\n]+\});/);
    if (!data) throw new Error('Missing results chart data');
    const { per }: { per: Record<string, Result> } = JSON.parse(data[1]);
    const rows = Object.values(per).filter(r => !r.baseline).map(r => {
      if (r.ci.length !== 2 || !r.n || Object.keys(r.by_task).length !== 4) throw new Error('Missing AbMaze result columns');
      board.parts = Object.fromEntries(Object.keys(r.by_task).map(k => [k, k]));
      return { model: r.label, setting: 'High reasoning effort', score: r.score,
        low: r.ci[0], high: r.ci[1], trials: r.n, cost: r.usd,
        metrics: Object.fromEntries(Object.entries(r.by_task).map(([k, v]) => [k, v[0]])) };
    });
    return checked(rows, 5);
  },
};
export default board;
