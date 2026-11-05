// DeepRSI (Hillclimb). www.deeprsi.com draws its leaderboard in the browser from a Vite bundle,
// /assets/results-<hash>.js, whose first `models:[...]` array holds each model's results:
// {id, name, points:[{effort, rating, cost, tokens, ...}]}. `rating` is the Bradley-Terry Elo the page shows, and
// `cost` is the average US dollars per attempt (one task). The bundle's file name changes with each release, so
// the home page is read first to find it. The bundle is read as text, never run. A later `models:` array holds
// the Elo-over-time series as number arrays and is skipped by the pattern below. Metrics: `steps` per attempt and
// `mtokens`, the point's `tokens`: millions of tokens per attempt, input included, which the board plots against Elo.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://www.deeprsi.com/';

const board: Leaderboard = {
  benchmark: 'deeprsi',
  url: PAGE,
  feed: `${PAGE}assets/results-<hash>.js (the models array: Elo rating, effort and cost per model)`,
  terms: 'deeprsi.com publishes no robots.txt or terms; the parent site hillclimb.com allows all paths for general agents (search=yes, ai-train=no).',
  aliases: {},
  chart: {
    title: 'Elo against average tokens per attempt',
    note: 'Each point is one model at one reasoning effort. Tokens count every model token in an attempt, input included.',
    x: { key: 'mtokens', label: 'Average tokens per attempt', unit: 'million', better: 'lower' },
    y: { key: 'score', label: 'Elo', better: 'higher' },
  },
  async fetch() {
    const home = await fetchText(PAGE);
    const asset = home.match(/\/assets\/results-[\w-]+\.js/)?.[0];
    if (!asset) throw new Error('no results bundle linked from the home page');
    const js = await fetchText(new URL(asset, PAGE).href);
    // the run's own timestamp, when the bundle names one
    const date = js.match(/generated_at:`(\d{4}-\d{2}-\d{2})/)?.[1];
    const rows: LeaderboardRow[] = [];
    const model = /\{id:`[^`]+`,name:`([^`]+)`[^{}[\]]*?points:\[((?:\{[^{}]*\},?)+)\]\}/g;
    for (const m of js.matchAll(model)) {
      for (const p of m[2].matchAll(/\{([^{}]*)\}/g)) {
        const rating = Number(p[1].match(/(?:^|,)rating:(-?[\d.]+(?:e[+-]?\d+)?)/)?.[1]);
        const cost = Number(p[1].match(/(?:^|,)cost:([\d.]+(?:e[+-]?\d+)?)/)?.[1]);
        const effort = p[1].match(/(?:^|,)effort:`([^`]*)`/)?.[1];
        if (!Number.isFinite(rating)) continue;
        const metrics: Record<string, number> = {};
        const mtokens = Number(p[1].match(/(?:^|,)tokens:([\d.]+(?:e[+-]?\d+)?)/)?.[1]);
        if (Number.isFinite(mtokens)) metrics.mtokens = mtokens;
        const steps = Number(p[1].match(/(?:^|,)steps:([\d.]+(?:e[+-]?\d+)?)/)?.[1]);
        if (Number.isFinite(steps)) metrics.steps = steps;
        rows.push({ model: m[1], score: rating, setting: effort || undefined, cost: Number.isFinite(cost) ? cost : undefined, date, metrics });
      }
    }
    if (!rows.length) throw new Error('no model ratings found in the results bundle');
    return rows;
  },
};
export default board;
