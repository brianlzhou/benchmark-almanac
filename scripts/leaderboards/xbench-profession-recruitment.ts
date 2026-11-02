// xbench-Recruitment (xbench Profession Aligned track, 2025). The board ships as a literal array in the
// xbench.org bundle (see xbenchArray in xbench-scienceqa.ts), one row per model with the average of the
// three task groups (company mapping, people to info, info to people), each a judge score mapped to 0 to
// 100. The average is the ranking and the score. Rows date from the May 2025 release.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { num } from '../lib/html.ts';
import { XBENCH_TERMS, xbenchArray } from './xbench-scienceqa.ts';

const board: Leaderboard = {
  benchmark: 'xbench-profession-recruitment',
  url: 'https://xbench.org/profession/hr',
  feed: 'https://xbench.org/<build>/index-*.js (array with average, companyMapping, peopleToInfo, infoToPeople)',
  terms: XBENCH_TERMS,
  aliases: {},
  async fetch() {
    const data = await xbenchArray<{ model: string; average: string }>(/\[\{rank:1,model:"[^"]+",company:"[^"]+",average:"[^"]+",companyMapping:/);
    const rows: LeaderboardRow[] = [];
    for (const r of data) {
      const score = num(r.average);
      if (!r.model || score === undefined) continue;
      // "Grok3-Search": Grok 3 run with its search tool (the Perplexity rows are products and stay unmatched)
      const search = r.model.match(/^(Grok.*?)-Search$/);
      rows.push({ model: search ? search[1] : r.model, score, harness: search ? 'search' : undefined, date: '2025-05-26' });
    }
    return rows;
  },
};
export default board;
