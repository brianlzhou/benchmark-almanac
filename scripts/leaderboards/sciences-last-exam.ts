// Science's Last Exam (AItonomy): the official six-assessment composite on all 113 v1 tasks.
// Read results.all as published, including End-to-end research's current zero scores, and exclude
// models with a null composite. Capability scores are metrics, never separate leaderboard rows.
// The board's cost/time average four capabilities only (PP, SC, SO, EO); HD and E2E report neither.
// Discover the current content script from the live page rather than pinning its hashed filename.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAfter } from '../lib/html.ts';

const PAGE = 'https://sciences-last-exam.org/leaderboard';
interface Result { score: number | null; cost: number | null; time: number | null }
interface Data {
  updated: string;
  models: { id: string; name: string; harness: string; setting: string }[];
  results: Record<string, Record<string, Result>>;
}
const board: Leaderboard = {
  benchmark: 'sciences-last-exam',
  url: PAGE,
  feed: `${PAGE} (current assets/data.*.js, leaderboard.results.all)`,
  terms: 'SLE publishes the public leaderboard and Apache-2.0 evaluation code; its contributor terms do not grant redistribution rights to submitted research materials.',
  chart: {
    title: 'Capability vs. cost',
    x: { key: 'cost', label: 'Cost per task', unit: '$', better: 'lower' },
    y: { key: 'score', label: 'Composite score', unit: 'score', better: 'higher' },
    note: 'SLE averages cost across four capabilities while its composite equally weights six assessments.',
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const page = await fetchText(PAGE);
    const path = page.match(/<script\b[^>]*src="(assets\/data\.[^"]+\.js)"/)?.[1];
    if (!path) throw new Error('SLE content script missing');
    await new Promise(resolve => setTimeout(resolve,1100));
    const d = jsonAfter<Data>(await fetchText(new URL(path,PAGE).href), 'leaderboard:');
    const out: LeaderboardRow[] = [];
    for (const m of d.models) {
      const r = d.results.all[m.id];
      if (r?.score == null) continue;
      if (!Number.isFinite(r.score)) throw new Error('SLE invalid composite');
      const metrics: Record<string, number> = {};
      for (const key of ['hd','pp','sc','so','eo','e2e']) {
        const value = d.results[key]?.[m.id]?.score;
        if (typeof value === 'number' && Number.isFinite(value)) metrics[key] = value;
      }
      if (r.cost != null) metrics.cost = r.cost;
      if (r.time != null) metrics.latency = r.time;
      out.push({ model: m.name, score: r.score, harness: `${m.harness}; DiscoveryRSI for Hypothesis Discovery`, setting: m.setting,
        cost: r.cost ?? undefined, metrics });
    }
    if (!out.length) throw new Error('SLE has no complete composite rows');
    return out;
  },
};
export default board;
