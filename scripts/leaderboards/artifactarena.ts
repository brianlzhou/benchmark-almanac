// ArtifactArena (MIT CSAIL and others). The leaderboard page loads a static snapshot,
// artifactarena.ai/snapshots/leaderboard.json (robots.txt disallows /api/, which serves the same data, but
// allows /snapshots/). Each entry is one model under one design condition ("Verifier-Grounded Refinement" or
// "Sampling") with the Elo of its champion robot; the condition is passed as the harness. The model slug
// carries the reasoning effort ("claude-fable-5-1-high"), which the resolver splits off as the setting.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://artifactarena.ai/snapshots/leaderboard.json';

interface Snapshot {
  updatedAt?: string;
  entries: { modelSlug: string; conditionLabel: string; elo: number; wins?: number; losses?: number; draws?: number; games?: number; winRate?: number }[];
}

const board: Leaderboard = {
  benchmark: 'artifactarena',
  url: 'https://artifactarena.ai/',
  feed: `${FEED} (entries, elo)`,
  terms: 'Static snapshot on artifactarena.ai; robots.txt disallows only /api/ and /film, and the project is MIT-licensed with a request to credit and cite it.',
  async fetch() {
    const data = await fetchJson<Snapshot>(FEED);
    return data.entries.map((e): LeaderboardRow => ({ model: e.modelSlug, score: e.elo, harness: e.conditionLabel,
      date: data.updatedAt?.slice(0, 10), metrics: Object.fromEntries(['wins', 'losses', 'draws', 'games', 'winRate'].flatMap(k => {
        const value = e[k as keyof typeof e]; return typeof value === 'number' && Number.isFinite(value) ? [[k, value]] : [];
      })) }));
  },
};
export default board;
