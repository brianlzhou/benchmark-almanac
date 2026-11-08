// ProgramBench tests passed: the share of hidden behavioral tests a run's rebuilt program passes, averaged over the
// 200 tasks. programbench.com plots it in its chart as "% Test Passed (Unofficial Metric)", and labs report this
// number in their model cards. The official leaderboard ranks runs by Resolved, the share of tasks whose every
// test passes, which the programbench record holds. This importer reads the same page through programbench.ts and
// makes the chart's number the score, with Resolved kept in metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import programbench from './programbench.ts';

const board: Leaderboard = {
  benchmark: 'programbench-tests-passed',
  url: programbench.url,
  feed: programbench.feed,
  terms: programbench.terms,
  aliases: programbench.aliases,

  async fetch(): Promise<LeaderboardRow[]> {
    const rows = await programbench.fetch();
    return rows.flatMap((r) => {
      const passed = r.metrics?.testsPassed;
      if (typeof passed !== 'number') return [];
      const { testsPassed: _, ...rest } = r.metrics ?? {};
      return [{ ...r, score: passed, metrics: { ...rest, resolved: r.score } }];
    });
  },
};
export default board;
