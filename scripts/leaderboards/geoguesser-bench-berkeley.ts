// GeoGuesser Bench ranks models by their mean rank across four tasks. Its leaderboard JSON gives average rank, where lower is better, and the underlying task scores.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const feed = "https://huanzhimao.com/GeoGuessr-Bench/assets/data/leaderboard.json";

const board: Leaderboard = {
  benchmark: "geoguesser-bench-berkeley",
  url: "https://huanzhimao.com/GeoGuessr-Bench/#leaderboard",
  feed,
  terms: "The project credits Google Street View for imagery. The project page gives no separate terms for score reuse. https://huanzhimao.com/GeoGuessr-Bench/ The feed host publishes robots.txt at https://huanzhimao.com/robots.txt.",
  async fetch() {
    type Column = { key: string; label: string; group: string; unit: string };
    type Model = { name: string; avg_rank: number; main: Record<string, { value: number; se: number }> };
    const data = await fetchJson<{ columns: Column[]; models: Model[] }>(feed);
    if (data.models.length < 23 || data.columns.length !== 4) throw new Error('Incomplete GeoGuesser scores');
    board.parts = Object.fromEntries(data.columns.map(c => [c.key, { name: c.label, group: c.group, unit: c.unit === 'pct' ? '%' : 'score', better: 'higher' }]));
    return data.models.map(m => {
      const metrics: Record<string, number> = {};
      for (const c of data.columns) {
        const part = m.main[c.key];
        if (!Number.isFinite(part?.value)) throw new Error('Missing ' + c.label);
        metrics[c.key] = part.value;
        metrics[c.key + 'SE'] = part.se;
      }
      if (!m.name || !Number.isFinite(m.avg_rank)) throw new Error('Missing average rank');
      return { model: m.name, score: m.avg_rank, metrics };
    });
  },
};
export default board;
