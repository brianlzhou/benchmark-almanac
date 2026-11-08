// ViBench 2.0 (Replit). vibench.ai is a Vite app whose bundle (/assets/main-<hash>.js, index-<hash>.js before November 2026) carries the results
// tables as rendered HTML. The "SII leaderboard" table holds the official Fireworks runs on all 17 products
// (4 builds each); its rows are <tr data-pass data-plan data-cost data-time data-testid="row-model-N">. The
// score is Pass@1 (data-pass), the share of builds passing every test plan, the board's headline; cost is
// the model's US dollar cost per build. Metrics: the plan pass rate (data-plan, `planPass`, the share of a
// build's test plans that pass), the build time in minutes (data-time, `minutes`) and the 95% interval of
// Pass@1 (the cell's "±9.3" or "(0.0–7.9)", as `ciLow` and `ciHigh`). The second table (rows "row-gen-N", Replit's own runs of older
// GPT models on the 8 public products only) is a different task subset and is not read.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { text } from '../lib/html.ts';

const SITE = 'https://vibench.ai';

const board: Leaderboard = {
  benchmark: 'vibench-2',
  url: `${SITE}/`,
  feed: `${SITE}/assets/main-<hash>.js (SII leaderboard rows, data-pass)`,
  terms: 'Public site bundle; robots.txt allows every path and the site states no terms of its own.',
  async fetch(): Promise<LeaderboardRow[]> {
    const html = await fetchText(`${SITE}/`);
    const js = html.match(/\/assets\/(?:main|index)-[\w-]+\.js/)?.[0];
    if (!js) throw new Error('ViBench bundle not found');
    const bundle = await fetchText(`${SITE}${js}`);
    const rows: LeaderboardRow[] = [];
    for (const m of bundle.matchAll(/<tr (data-pass="[\d.]+"[^>]*?)data-testid="row-model-\d+">([\s\S]*?)<\/tr>/g)) {
      const attr = (name: string) => m[1].match(new RegExp(`data-${name}="([\\d.]+)"`))?.[1];
      const cell = m[2].match(/<span class="vb-rm">([\s\S]*?)<\/th>/)?.[1] ?? '';
      const model = text(cell.replace(/<span class="vb-rlogo">[\s\S]*?<\/span>/, ''));
      const score = Number(attr('pass'));
      if (!model || !Number.isFinite(score)) continue;
      const metrics: Record<string, number> = {};
      if (attr('plan')) metrics.planPass = Number(attr('plan'));
      if (attr('time')) metrics.minutes = Number(attr('time'));
      // the Pass@1 cell's 95% interval: "±9.3", or an exact range "(0.0–7.9)" near 0%
      const ci = text(m[2].match(/<small>([\s\S]*?)<\/small>/)?.[1] ?? '');
      const pm = ci.match(/±\s*([\d.]+)/);
      const range = ci.match(/([\d.]+)\s*[–-]\s*([\d.]+)/);
      if (pm) Object.assign(metrics, { ciLow: Math.max(0, score - Number(pm[1])), ciHigh: Math.min(100, score + Number(pm[1])) });
      else if (range) Object.assign(metrics, { ciLow: Number(range[1]), ciHigh: Number(range[2]) });
      rows.push({ model, score, cost: attr('cost') ? Number(attr('cost')) : undefined, metrics });
    }
    if (!rows.length) throw new Error('no SII leaderboard rows in the ViBench bundle');
    return rows;
  },
};
export default board;
