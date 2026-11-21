// Ramen Bench rates a single HTML rendering of a bowl of ramen. The leaderboard ranks rated runs by mean stars.
// Its votes API supplies the ratings and its registry links run manifests with model, harness, timing and usage.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const base = 'https://bitbin.de/ramen-bench/runs/';
const feed = 'https://ramen-bench-api.stephen-dda.workers.dev/votes';
interface Run {
  id: string; model: { displayName: string }; variation: { displayName: string }; harness: { name: string };
  artifacts: { result: string }; timing?: { completedAt?: string; wallDurationMs?: number };
  usage?: { tokens?: { output?: number }; cost?: { currency: string; total: number } };
}
const board: Leaderboard = {
  benchmark: 'ramen-bench', url: 'https://bitbin.de/ramen-bench/', feed,
  terms: 'Public ratings API and per-run manifests linked by the Ramen Bench site.',
  stats: { votes: { name: 'Votes', unit: 'count' }, seconds: { name: 'Wall time', unit: 'seconds', better: 'lower' } },
  async fetch() {
    const registry = await fetchJson<{ runs: string[] }>(base + 'registry.json');
    const ratings = await fetchJson<{ runId: string; average: number; count: number }[]>(feed);
    const paths = new Set(registry.runs);
    const rows: LeaderboardRow[] = [];
    for (const r of ratings) {
      const path = r.runId + '/run.json';
      if (!paths.has(path) || !r.count) continue;
      const manifest = new URL(path, base);
      if (!manifest.href.startsWith(base)) throw new Error('Invalid Ramen Bench manifest path');
      await new Promise(resolve => setTimeout(resolve, 1000));
      const run = await fetchJson<Run>(manifest.href);
      if (run.id !== r.runId || !run.model.displayName || !Number.isFinite(r.average)) throw new Error('Invalid rated run');
      const elapsed = run.timing?.wallDurationMs;
      rows.push({ model: run.model.displayName, setting: run.variation.displayName, harness: run.harness.name, score: r.average,
        date: run.timing?.completedAt?.slice(0,10), link: new URL(run.artifacts.result, manifest).href,
        cost: run.usage?.cost?.currency === 'USD' ? run.usage.cost.total : undefined, tokens: run.usage?.tokens?.output,
        metrics: { votes: r.count, ...(typeof elapsed === 'number' ? { seconds: elapsed / 1000 } : {}) } });
    }
    if (rows.length < 92) throw new Error('Missing rated Ramen Bench runs');
    return rows;
  },
};
export default board;
