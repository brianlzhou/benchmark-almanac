// AI GameStore (Ying, Tenenbaum and collaborators, NeurIPS 2026): vision-language models play short episodes of
// 100 games adapted from Apple App Store and Steam top charts, 10 of them public. Each game score is divided by the
// average human score, and the board ranks models by the geometric mean of those ratios with 95% intervals, on all
// games by default and on the public and private games apart. The site's leaderboard reads /table.tsv, which gives
// each ratio as a fraction of the human average (Human = 1), so scores here are percentages of the human average.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const FEED = 'https://aigamestore.org/table.tsv';
const COLS = ['Model', 'Public Games', 'Public CI Low', 'Public CI High', 'All Games', 'All CI Low', 'All CI High', 'Private Games', 'Private CI Low', 'Private CI High'];
const pct = (s: string | undefined) => (s === undefined || s.trim() === '' ? undefined : Math.round(Number(s) * 1000) / 10);

const board: Leaderboard = {
  benchmark: 'ai-gamestore',
  url: 'https://aigamestore.org/leaderboard',
  feed: FEED,
  terms: 'The site’s code is MIT licensed, and the leaderboard reads this public file. The authors ask that the games, videos and study data never be used for AI training, as a request rather than a license condition.',
  // the plain API name is the June 2025 stable release, not the September preview
  aliases: { 'Gemini-2.5-Flash': 'gemini-2-5-flash-jun-2025' },
  parts: {
    publicGames: { name: 'Public games', group: 'Games', note: 'The 10 games anyone can play on the site.' },
    privateGames: { name: 'Private games', group: 'Games', note: 'The 90 games kept off the site.' },
  },
  async fetch() {
    const lines = (await fetchText(FEED)).trim().split('\n').map((l) => l.split('\t').map((c) => c.trim()));
    const head = lines[0];
    if (COLS.some((c, i) => head[i] !== c)) throw new Error(`AI GameStore: unexpected columns ${head.join(', ')}`);
    const rows: LeaderboardRow[] = [];
    for (const c of lines.slice(1)) {
      if (!c[0] || /^human/i.test(c[0])) continue;
      const score = pct(c[4]);
      if (score === undefined || !Number.isFinite(score)) continue;
      const metrics: Record<string, number> = {};
      const pub = pct(c[1]);
      const priv = pct(c[7]);
      if (pub !== undefined) metrics.publicGames = pub;
      if (priv !== undefined) metrics.privateGames = priv;
      rows.push({ model: c[0], score, low: pct(c[5]), high: pct(c[6]), metrics });
    }
    if (rows.length < 5) throw new Error(`AI GameStore: ${rows.length} models, expected at least 5`);
    return rows;
  },
};
export default board;
