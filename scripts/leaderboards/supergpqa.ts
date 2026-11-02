// SuperGPQA (ByteDance Seed and M-A-P). supergpqa.github.io is a static single-page app whose results ship
// inside its script bundle: one object per board, each model's entry written as JSON.parse('{...}') with
// overall and per-difficulty accuracy (0 to 1) under the prompt setting. The chat-model board is zero-shot
// and the base-model board is five-shot. The importer finds the bundle from the page, reads every entry that
// has a "zero-shot" block (as data, never run) and keeps its overall accuracy × 100. Five-shot base-model
// runs are left out, since their names would resolve to the chat models.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const SITE = 'https://supergpqa.github.io/';

const board: Leaderboard = {
  benchmark: 'supergpqa',
  url: SITE,
  feed: `${SITE}assets/index-<hash>.js (zero-shot results in the bundle)`,
  terms: 'Static GitHub Pages site with no stated terms or robots rules; the SuperGPQA repository publishes the evaluation code and results.',
  aliases: {
    'kimi-k2-0711-preview': 'kimi-k2-jul-2025',
    'claude-3-5-sonnet-20241022': 'claude-3-5-sonnet-october-2024',
    'gpt-4o-2024-05-13': 'gpt-4o-may-2024',
    'gpt-4o-2024-08-06': 'gpt-4o-aug-2024',
    'gpt-4o-2024-11-20': 'gpt-4o-nov-2024',
    'Mistral-Large-Instruct-2411': 'mistral-large-2-nov-2024',
  },
  async fetch() {
    const page = await fetchText(SITE);
    const src = page.match(/<script[^>]+src="([^"]*\/assets\/index-[\w-]+\.js)"/)?.[1];
    if (!src) throw new Error('bundle not found on the page');
    const js = await fetchText(new URL(src, SITE).href);
    const rows: LeaderboardRow[] = [];
    for (const m of js.matchAll(/"([^"]{2,80})":JSON\.parse\('(\{"(?:zero|five)-shot"[^']*)'\)/g)) {
      const acc = (JSON.parse(m[2]) as Record<string, { accuracy?: number }>)['zero-shot']?.accuracy;
      if (typeof acc === 'number') rows.push({ model: m[1], score: acc * 100 });
    }
    if (!rows.length) throw new Error('no zero-shot results in the bundle');
    return rows;
  },
};
export default board;
