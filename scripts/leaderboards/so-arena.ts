// SO-Arena evaluates static decisions and interactive tasks. The board's JSON gives the score on the 1,232-task panel.
// The authors weight its eleven domains equally and report reliability separately.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://lichenlillc.github.io/SO-Arena/';
const feed = url + 'data/arena.json';
type Model = {
  name: string; score: number; reasoning: string; domains: Record<string, number>; group: string;
  tiers: Record<string, Record<string, number>>; reliability: Record<string, number>;
  latency: { mean_ms: number; p90_ms?: number; p99_ms?: number };
  order_acc?: { original: number; min: number; max: number };
};
const tierNames: Record<string, string> = { E: 'Easy', M: 'Medium', H: 'Hard', V: 'Very hard', All: 'All' };
const board: Leaderboard = {
  benchmark: 'so-arena', url, feed,
  terms: 'SO-Arena publishes its annotations under CC BY 4.0 and its code under MIT. https://github.com/holdrain/SO-Arena#licence',
  async fetch() {
    const data = await fetchJson<{ domains: { id: string; name: string }[]; models: Model[] }>(feed);
    if (data.domains.length !== 11) throw new Error('SO-Arena domain panel changed');
    const parts: Record<string, string> = Object.fromEntries(data.domains.map(d => [d.id, d.name]));
    const rows = data.models.map(r => {
      const metrics = { ...r.domains, ...r.reliability, latencyMs: r.latency.mean_ms } as Record<string, number>;
      for (const d of data.domains) {
        if (!Number.isFinite(r.domains[d.id])) throw new Error('Missing SO-Arena domain ' + d.id);
        for (const [tier, score] of Object.entries(r.tiers[d.id])) {
          const key = d.id + tier;
          parts[key] = d.name + ': ' + tierNames[tier];
          metrics[key] = score;
        }
      }
      if (r.order_acc) Object.assign(metrics, { originalOrderAccuracy: r.order_acc.original, minOrderAccuracy: r.order_acc.min, maxOrderAccuracy: r.order_acc.max });
      if (r.latency.p90_ms != null) metrics.latencyP90Ms = r.latency.p90_ms;
      if (r.latency.p99_ms != null) metrics.latencyP99Ms = r.latency.p99_ms;
      return { model: r.name, score: r.score, open: r.group === 'open', setting: r.reasoning === 'Not disclosed' ? undefined : 'Reasoning: ' + r.reasoning, metrics };
    });
    board.parts = parts;
    return checked(rows, 22);
  },
};
export default board;
