// Vision2Web on vision2web-bench.github.io. The page renders data/leaderboard.json, which holds one board
// per season ("S4-2026": Oct to Dec 2026, each with its own judge and agent versions). Seasons are rerun
// with new judges and agents, so their scores do not compare, and this importer reads only the newest
// season (latest last_updated), the one the page opens on. Each entry is named "<model> + <agent>" and
// "overall" (0 to 100) is the headline.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://vision2web-bench.github.io/data/leaderboard.json';

interface Season {
  last_updated?: string;
  models: { name: string; date?: string; overall?: number | null }[];
}

const board: Leaderboard = {
  benchmark: 'vision2web',
  url: 'https://vision2web-bench.github.io/',
  feed: `${FEED} (newest season)`,
  terms: 'Static JSON on a GitHub Pages site with no robots.txt and no terms; the scores are cited to the Vision2Web authors.',
  aliases: {},
  async fetch() {
    const { seasons } = await fetchJson<{ seasons: Record<string, Season> }>(FEED);
    const [name, season] = Object.entries(seasons).sort((a, b) => (b[1].last_updated ?? '').localeCompare(a[1].last_updated ?? ''))[0] ?? [];
    if (!season) throw new Error('no seasons in the Vision2Web data');
    const rows: LeaderboardRow[] = [];
    for (const m of season.models) {
      if (typeof m.overall !== 'number') continue;
      const [model, ...agent] = m.name.split(' + ');
      rows.push({ model: model.trim(), score: m.overall, harness: agent.join(' + ').trim() || undefined, date: m.date });
    }
    if (!rows.length) throw new Error(`no rows in Vision2Web season ${name}`);
    return rows;
  },
};
export default board;
