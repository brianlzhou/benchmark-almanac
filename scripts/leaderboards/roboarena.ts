// RoboArena (distributed real-world A/B evaluation of DROID robot policies). robo-arena.github.io is a
// single-page app whose Policy Leaderboard loads JSON from the team's API, /api/leaderboard: per policy
// the rating (`score`, a Bradley-Terry style rating with no ceiling), its std, the number of A/B evals
// and whether it is open source. The page shows only policies with at least 100 evaluations as official
// (its "all" toggle adds the rest, marked unofficial), so only those rows are read. The rating is the
// score. Policy ids are run names ("pi05_droid"); the DROID fine-tunes of registry models get aliases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const PAGE = 'https://robo-arena.github.io/';
const FEED = 'https://roboarena-api-domain-name.online/api/leaderboard';
// the page's own cut-off for official rows
const OFFICIAL_EVALS = 100;

const board: Leaderboard = {
  benchmark: 'roboarena',
  url: `${PAGE}leaderboard`,
  feed: `${FEED} (rating of policies with at least ${OFFICIAL_EVALS} A/B evals)`,
  terms: 'Public JSON API that the RoboArena leaderboard page reads (the API host has no robots.txt and the project states no terms for it).',
  aliases: {
    // DROID fine-tunes released with openpi
    pi05_droid: 'pi0-5',
    pi0_fast_droid: 'pi0-fast',
    pi0_droid: 'pi0',
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const data = await fetchJson<{ board: { policy: string; score?: number; num_evals?: number }[] }>(FEED);
    const rows: LeaderboardRow[] = [];
    for (const p of data.board) {
      if (!p.policy || typeof p.score !== 'number' || (p.num_evals ?? 0) < OFFICIAL_EVALS) continue;
      rows.push({ model: p.policy, score: p.score });
    }
    if (!rows.length) throw new Error('no official RoboArena rows');
    return rows;
  },
};
export default board;
