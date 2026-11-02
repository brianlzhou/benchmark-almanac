// BlenderWorld (Alibaba and partners). blenderworld.github.io draws its leaderboard from
// data/site-data.js, a `window.BLENDERWORLD = {...}` JSON object whose `models` list carries per model a rank,
// the overall `score` (out of 100: half rubric, half dimension quality, the column the board ranks by), the
// rubric and dimension parts, and text-only and multimodal splits. The overall score is read.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAfter } from '../lib/html.ts';

const SITE = 'https://blenderworld.github.io';
const FEED = `${SITE}/data/site-data.js`;

const board: Leaderboard = {
  benchmark: 'blenderworld',
  url: `${SITE}/`,
  feed: `${FEED} (window.BLENDERWORLD.models, score)`,
  terms: 'Data file on GitHub Pages that the public page loads; robots.txt allows it.',
  aliases: {
    // ByteDance Seed 2.1 Pro, its 2026-09-15 snapshot (the registry has one Seed 2.1 Pro record)
    'Seed2.1pro-0915': 'seed-2-1-pro',
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const data = jsonAfter<{ models: { name: string; score: number }[] }>(await fetchText(FEED), 'window.BLENDERWORLD =');
    return data.models.map((m) => ({ model: m.name, score: m.score }));
  },
};
export default board;
