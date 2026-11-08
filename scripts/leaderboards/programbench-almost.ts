// ProgramBench almost solved: the share of the 200 tasks whose rebuilt program passes at least 95% of the hidden
// behavioral tests, the Almost column of programbench.com's leaderboard. Many labs report this number. The board
// ranks runs by Resolved (every test passes), which the programbench record holds. This importer reads the same page
// through programbench.ts and makes Almost the score, with Resolved kept in metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import programbench from './programbench.ts';

const board: Leaderboard = {
  benchmark: 'programbench-almost',
  url: programbench.url,
  feed: programbench.feed,
  terms: programbench.terms,
  aliases: programbench.aliases,

  async fetch(): Promise<LeaderboardRow[]> {
    const rows = await programbench.fetch();
    return rows.flatMap((r) => {
      const almost = r.metrics?.almost;
      if (typeof almost !== 'number') return [];
      const { almost: _, ...rest } = r.metrics ?? {};
      return [{ ...r, score: almost, metrics: { ...rest, resolved: r.score } }];
    });
  },
};
export default board;
