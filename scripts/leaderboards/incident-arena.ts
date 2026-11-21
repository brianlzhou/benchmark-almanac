// Incident Arena evaluates repair success across 20 service incidents. Its public leaderboard JSON reports pass@1, task-cluster bootstrap intervals and per-incident means.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://incident-arena.com/data/leaderboard.json";
interface Entry { name: string; effort: string; score: number; ci: number[]; n: number; cost: number | null; minutes: number | null; taskMeans: Record<string, number>; taskCount: number; experiment: string }

const board: Leaderboard = {
  benchmark: "incident-arena",
  url: "https://incident-arena.com/",
  feed: FEED,
  terms: "The site offers a results download. I found no separate data license at https://incident-arena.com/ The robots URL returns 404.",
  async fetch() {
    const data = await fetchJson<{ models: Entry[]; sources: { experiment: string; sourceUrl?: string }[] }>(FEED);
    if (data.models.length < 15) throw new Error('Missing ranked incident configurations');
    const parts: Record<string, string> = {};
    const rows = data.models.map(r => {
      if (!r.name || ![r.score,r.ci?.[0],r.ci?.[1],r.n].every(Number.isFinite) || Object.keys(r.taskMeans).length !== r.taskCount || r.taskCount < 20) throw new Error('Incomplete incident result');
      const metrics: Record<string, number> = {};
      if (r.minutes != null) metrics.latency = r.minutes * 60;
      for (const [key, value] of Object.entries(r.taskMeans)) {
        if (!Number.isFinite(value)) throw new Error('Invalid incident mean');
        parts[key] = key; metrics[key] = value * 100;
      }
      return { model: r.name, setting: r.effort, score: r.score, low: r.ci[0], high: r.ci[1], trials: r.n, cost: r.cost ?? undefined,
        link: data.sources.find(s => s.experiment === r.experiment)?.sourceUrl, metrics };
    });
    board.parts = parts;
    return rows;
  },
};
export default board;
