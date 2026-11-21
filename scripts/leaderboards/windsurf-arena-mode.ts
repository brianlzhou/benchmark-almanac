// Devin Arena Mode is a final ELO leaderboard from side-by-side coding preferences.
// The headline score is the published ELO rating, with its confidence interval.
// The importer reads the embedded leaderboard array in Devin's public JavaScript bundle.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://devin.ai/leaderboard';
const FEED = 'https://devin.ai/_next/static/immutable/chunks/0l4rtumvltgfs.js';
const board: Leaderboard = {
  benchmark: 'windsurf-arena-mode', url: PAGE, feed: FEED,
  terms: 'Devin publishes this final Arena Mode comparison in its public leaderboard bundle. Separate score reuse terms are not stated.',
  headline: 'The leaderboard ranks models by ELO rating from Arena Mode usage.',
  stats: { speed: { name: 'Model speed', unit: 'speedup', better: 'higher' } },
  async fetch() {
    const js = await fetchText(FEED);
    const rows: LeaderboardRow[] = [];
    const pattern = /\{model:"([^"]+)",eloRating:([0-9.]+),confidenceLower:([0-9.]+),confidenceUpper:([0-9.]+),modelSpeed:([0-9.e+-]+)/g;
    for (const match of js.matchAll(pattern)) {
      const [, model, elo, low, high, speed] = match;
      rows.push({ model, score: Number(elo), low: Number(low), high: Number(high), metrics: { speed: Number(speed) } });
    }
    if (rows.length < 10) throw new Error(`Windsurf Arena Mode: ${rows.length} rows, expected at least 10`);
    return rows;
  },
};
export default board;
