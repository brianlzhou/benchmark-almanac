// RWE-Bench (Xplore). xplore.ai/rwe-bench fills its leaderboard from /js/rwe-data.js ("every number on
// /rwe-bench comes from this file"): window.RWE.models lists one object per model with name, harness,
// effort, pass1 (average pass rate, %, which sets the page's order and rank), pass@k, cost (mean API spend
// for one run of one task, USD) and outTokensK. pass1 is the score. The file uses single-quoted strings,
// which the shared literal reader does not take, so each model object is read with a pattern.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const SITE = 'https://xplore.ai';
const FEED = `${SITE}/js/rwe-data.js`;

const field = (obj: string, key: string) => obj.match(new RegExp(`\\b${key}:\\s*('([^']*)'|null|-?[\\d.]+)`))?.[2] ?? obj.match(new RegExp(`\\b${key}:\\s*(-?[\\d.]+)`))?.[1];

const board: Leaderboard = {
  benchmark: 'rwe-bench',
  url: `${SITE}/rwe-bench`,
  feed: `${FEED} (window.RWE.models, pass1)`,
  terms: 'Data file the public page loads; robots.txt allows / for all user agents except named AI crawlers (content signal use=reference, ai-train=no).',
  async fetch(): Promise<LeaderboardRow[]> {
    const js = await fetchText(FEED);
    const start = js.indexOf('models:');
    if (start < 0) throw new Error('RWE models list not found');
    const rows: LeaderboardRow[] = [];
    for (const m of js.slice(start).matchAll(/\{\s*name:[^{}]*?pass1:[^{}]*\}/g)) {
      const obj = m[0];
      const name = field(obj, 'name');
      const score = Number(field(obj, 'pass1'));
      const cost = Number(field(obj, 'cost'));
      const tokens = Number(field(obj, 'outTokensK'));
      if (!name || !Number.isFinite(score)) continue;
      rows.push({
        model: name,
        score,
        setting: field(obj, 'effort') || undefined,
        harness: field(obj, 'harness') || undefined,
        cost: Number.isFinite(cost) && cost > 0 ? cost : undefined,
        tokens: Number.isFinite(tokens) && tokens > 0 ? tokens * 1000 : undefined,
      });
    }
    return rows;
  },
};
export default board;
