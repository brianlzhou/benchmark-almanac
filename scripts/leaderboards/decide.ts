// DECIDE (Tazo Labs and Bolna): 4,867 voice-call decision questions. The board defaults to the
// published DECIDE Balance Score (DBS, 0 to 100), not accuracy. Accuracy and family scores are
// diagnostics. Run cost covers every question, so cost divides it by the published question count.
// The chart follows leaderboard-model.js: median-centered accuracy-per-dollar and latency indices.
// Tazo latency is optimized serving; the other rows use client-observed latency, as the feed states.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://benchmark.tazolabs.com/data/leaderboard.json';
interface Model {
  name: string; input: string; dbs: number; accuracy: number; cost_usd: number; latency_ms: number;
  families: Record<string, { accuracy: number }>;
}
const board: Leaderboard = {
  benchmark: 'decide',
  url: 'https://benchmark.tazolabs.com/leaderboard',
  feed: FEED,
  terms: 'The DECIDE repository licenses evaluator and website source under MIT; private recordings and annotations are excluded from that license.',
  chart: {
    title: 'DECIDE efficiency–latency Pareto frontier',
    x: { key: 'latencyIndex', label: 'Normalized latency', unit: 'index', better: 'lower' },
    y: { key: 'efficiencyIndex', label: 'Normalized efficiency', unit: 'index', better: 'higher' },
    note: 'Models compare accuracy per dollar with latency using the board’s median-centered scales.',
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const d = await fetchJson<{ schema_version: number; questions: number; reference: { latency_ms: number }; models: Model[] }>(FEED);
    if (d.schema_version !== 1 || !(d.questions > 0) || !d.models?.length) throw new Error('DECIDE schema changed');
    const eff = d.models.map(m => m.accuracy / m.cost_usd).sort((a,b) => a-b);
    const mid = Math.floor(eff.length / 2);
    const median = eff.length % 2 ? eff[mid] : (eff[mid-1] + eff[mid]) / 2;
    return d.models.map(m => {
      if (!m.name || ![m.dbs,m.accuracy,m.cost_usd,m.latency_ms].every(Number.isFinite) || m.cost_usd <= 0) throw new Error('DECIDE invalid row');
      const efficiency = m.accuracy / m.cost_usd;
      return {
        model: m.name,
        setting: m.input === 'audio' ? 'direct audio' : 'speech-to-text input',
        score: m.dbs,
        cost: m.cost_usd / d.questions,
        metrics: {
          accuracy: m.accuracy * 100,
          runCost: m.cost_usd,
          latency: m.latency_ms / 1000,
          latencyIndex: 100 * m.latency_ms / (d.reference.latency_ms + m.latency_ms),
          efficiencyIndex: efficiency === 0 ? 0 : 100 / (1 + median / efficiency),
          ...Object.fromEntries(Object.entries(m.families).slice(0,16).map(([key,v]) => [key, v.accuracy * 100])),
        },
      };
    });
  },
};
export default board;
