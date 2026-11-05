// LABBench2 on Edison Scientific's research site. The benchmark page is static HTML whose leaderboard
// table lists # | Model | Variant | Average score | Average output tokens | Coverage | Published. Average
// score is the mean over the subtasks a run covered (0 to 1, shown here as 0 to 100), the variant (tools and
// effort) is the setting, Average output tokens ("5.4k") is the output tokens per task and Published is the date. Some runs cover 14 of the 15 subtasks, as the page shows.
// The reader lives in visulogic.ts.
import type { Leaderboard } from './types.ts';
import { tableRows } from './visulogic.ts';

const URL = 'https://advances.edisonscientific.com/benchmarks/labbench2/';

const board: Leaderboard = {
  benchmark: 'labbench2',
  url: URL,
  feed: `${URL} (leaderboard table)`,
  terms: 'Static public page; the site has no robots.txt and no terms, and describes itself as hosting leaderboards and source data for LABBench2.',
  aliases: {},
  fetch: () =>
    tableRows(URL, {
      model: /^Model$/i,
      score: /^Average score$/i,
      scale: 100,
      setting: /^Variant$/i,
      date: /^Published$/i,
      tokens: /^Average output tokens$/i,
    }),
};
export default board;
