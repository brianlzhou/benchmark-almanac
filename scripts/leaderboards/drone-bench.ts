// Drone-Bench (Andon Labs). andonlabs.com is a prerendered SvelteKit site. The page's headline chart,
// "Progress towards baseline", is drawn from a literal array in one of the chunks its node modules import:
// per model a short label, the release date and heroScorePct, the mean over the five tasks of
// min(average run score, human baseline) / baseline, in percent. That is the score here. The labels are
// short handles ("opus-4-8", "gemini-3.1", "gpt-6"); the ones the resolver cannot place get aliases that
// follow the page's own slugs and release dates.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://andonlabs.com/evals/drone-bench';
const BASE = 'https://andonlabs.com/_app/immutable/';

const board: Leaderboard = {
  benchmark: 'drone-bench',
  url: PAGE,
  feed: `${BASE}chunks/<hash>.js (chart array with heroScorePct)`,
  terms: 'Public static asset of andonlabs.com; the site publishes no terms of use or robots.txt, so the scores are cited to Andon Labs.',
  aliases: {
    'gpt-4o-may': 'gpt-4o-may-2024',
    'gpt-4o-nov': 'gpt-4o-nov-2024',
    'opus-4-0': 'claude-opus-4',
    // the page's slug is gemini-2.5-pro with release date 2025-06-17
    'gemini-2.5': 'gemini-2-5-pro-jun-2025',
    'gemini-3.1': 'gemini-3-1-pro',
    // the page's slug is gpt-6-astra (released 2026-09-03)
    'gpt-6': 'gpt-6-astra',
    'fable-5-1': 'claude-fable-5-1',
  },
  async fetch() {
    const html = await fetchText(PAGE);
    const nodes = [...new Set([...html.matchAll(/_app\/immutable\/(nodes\/[\w.-]+\.js)/g)].map((m) => m[1]))];
    const chunks = new Set<string>();
    for (const n of nodes) {
      for (const m of (await fetchText(BASE + n)).matchAll(/from"\.\.\/chunks\/([\w.-]+\.js)"/g)) chunks.add(`chunks/${m[1]}`);
    }
    let js = '';
    for (const c of chunks) {
      const s = await fetchText(BASE + c);
      if (s.includes('heroScorePct')) {
        js = s;
        break;
      }
    }
    if (!js) throw new Error('Drone-Bench chart data not found');
    const rows: LeaderboardRow[] = [];
    for (const m of js.matchAll(/\{label:"([^"]+)",provider:"[^"]*",releaseDate:"[\d-]+",[^{}]*?heroScorePct:([\d.]+)/g)) {
      rows.push({ model: m[1], score: Number(Number(m[2]).toFixed(2)) });
    }
    if (rows.length < 10) throw new Error(`only ${rows.length} Drone-Bench rows`);
    return rows;
  },
};
export default board;
