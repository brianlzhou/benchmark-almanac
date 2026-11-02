// Holdings-ITHelpdeskBench (helpdesk ticket resolution) on evals.thriveholdings.com. The page's server HTML
// renders only the individual-tax table (read by holdings-individualtaxbench.ts); the helpdesk tab is drawn
// in the browser from an array in the route bundle /assets/home-<hash>.js, one object per configuration:
// {model, reasoning, correct, failed, graded, score, cost, minutes}. The score is the pass rate (0 to 100),
// the column the tab and the home page's "Leading models" show; reasoning is the setting and cost the US
// dollars per ticket. Numbers like ".047" are not JSON, so each object is read with a pattern.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const SITE = 'https://evals.thriveholdings.com';

const board: Leaderboard = {
  benchmark: 'thrive-holdings-helpdesk-ticket-resolution-benchmark',
  url: `${SITE}/?benchmark=it-helpdesk#it-helpdesk`,
  feed: `${SITE}/assets/home-<hash>.js (helpdesk results array, score)`,
  terms: 'Public site bundle; robots.txt allows all paths and the site publishes no terms.',
  aliases: {
    // the dated DeepSeek V4 Pro snapshot of 2026-08-13
    'deepseek/deepseek-v4-pro-0813': 'deepseek-v4-pro',
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const html = await fetchText(`${SITE}/`);
    const path = html.match(/\/assets\/home-[\w-]+\.js/)?.[0];
    if (!path) throw new Error('home bundle not found');
    const js = await fetchText(`${SITE}${path}`);
    const re = /\{model:"([^"]+)",reasoning:"([^"]*)",correct:\d+,failed:\d+,graded:(\d+),score:([\d.]+),cost:([\d.]*)/g;
    const rows: LeaderboardRow[] = [];
    for (const m of js.matchAll(re)) {
      rows.push({ model: m[1], score: Number(m[4]), setting: m[2] || undefined, cost: m[5] ? Number(m[5]) : undefined });
    }
    if (rows.length < 10) throw new Error(`only ${rows.length} helpdesk rows found`);
    return rows;
  },
};
export default board;
