// Browser Use LinkedIn ranks agent configurations by correctness to the tenth power discounted by cost.
// Harbor Hub loads the public rows from its paginated leaderboard-read function.
import type { Leaderboard } from './types.ts';
import { fetchText, fetchJson } from '../lib/util.ts';

export const harborFeed = 'https://ofhuhcpkvzjlejydnvyd.supabase.co/functions/v1/leaderboard-read';
export const harborTerms = 'Public leaderboard under Harbor Hub’s Terms of Service and Acceptable Use Policy.';
interface Entry {
  metadata: Record<string, string>;
  metrics: Record<string, number>;
  created_at: string;
}
interface Response {
  leaderboard: { package: string; name: string };
  rows: Entry[];
  pagination: { total: number; total_pages: number };
}

export async function harborRows(pkg: string, name: string, minimum: number) {
  const constants = await fetchText('https://raw.githubusercontent.com/harbor-framework/harbor/main/src/harbor/auth/constants.py');
  const key = constants.match(/^DEFAULT_SUPABASE_PUBLISHABLE_KEY = "([^"]+)"/m)?.[1];
  if (!key) throw new Error('Harbor CLI publishable key missing');
  const rows: Entry[] = [];
  for (let page = 1; ; page++) {
    const data = await fetchJson<Response>(harborFeed, {
      method: 'POST',
      headers: { apikey: key, 'content-type': 'application/json' },
      body: JSON.stringify({ package: pkg.toLowerCase(), name, page, page_size: 50 }),
    });
    if (data.leaderboard.package !== pkg || data.leaderboard.name !== name) throw new Error('Unexpected Harbor leaderboard');
    rows.push(...data.rows);
    if (page >= data.pagination.total_pages) {
      if (rows.length !== data.pagination.total || rows.length < minimum) throw new Error('Incomplete Harbor leaderboard');
      return rows;
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

const board: Leaderboard = {
  benchmark: 'browser-use-linkedin',
  url: 'https://hub.harborframework.com/datasets/lowgular/browser-use-linkedin?tab=leaderboard',
  feed: harborFeed,
  terms: harborTerms,
  harnesses: 'system',
  async fetch() {
    const rows = await harborRows('lowgular/browser-use-linkedin', 'v0-2-4', 21);
    return rows.map(({ metadata, metrics, created_at }) => {
      if (!metadata.model || !metadata.label || !metadata.harness || !Number.isFinite(metrics.score)) throw new Error('Missing LinkedIn row fields');
      return {
        model: metadata.model, harness: metadata.harness, setting: metadata.label,
        score: metrics.score, cost: metrics.cost_per_task_usd, trials: metrics.runs_per_task,
        date: created_at.slice(0, 10), metrics: { ...metrics, latency: metrics.seconds_per_task },
      };
    });
  },
};
export default board;
