// BBEH micro average: the share of all 4,520 BIG-Bench Extra Hard examples answered correctly. The makers' board
// (leaderboard.md in google-deepmind/bbeh) lists it as "BBEH (Micro Avg)" beside its headline, the harmonic mean
// over the 23 tasks, which the big-bench-extra-hard record holds. Labs print the micro average in their model
// cards. This importer reads the same table through big-bench-extra-hard.ts and makes the micro average the score,
// with the harmonic mean kept in metrics as "harmonic" and the mini set's micro average as "mini".
import type { Leaderboard, LeaderboardRow } from './types.ts';
import bbeh from './big-bench-extra-hard.ts';

const board: Leaderboard = {
  benchmark: 'big-bench-extra-hard-micro',
  url: bbeh.url,
  feed: bbeh.feed,
  terms: bbeh.terms,
  aliases: bbeh.aliases,
  async fetch(): Promise<LeaderboardRow[]> {
    const rows = await bbeh.fetch();
    return rows.flatMap((r) => {
      const micro = r.metrics?.micro;
      if (typeof micro !== 'number') return [];
      const { micro: _, ...rest } = r.metrics ?? {};
      return [{ ...r, score: micro, metrics: { ...rest, harmonic: r.score } }];
    });
  },
};
export default board;
