// $OneMillion-Bench (xbench Profession Aligned track). The board at xbench.org/profession/onemillion reads
// /api/one-millions from the xbench Strapi API (see xbench-scienceqa.ts); the importer asks for every row
// rather than the page's top ten. Pass rate (share of tasks that pass the rubric, 0 to 100) is the page's
// sort and the score. Rows typed "Base" are the plain model runs, the only type the board shows.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { XBENCH_API, XBENCH_TERMS, xbenchApi } from './xbench-scienceqa.ts';

const PATH = 'one-millions?sort=passRate:desc&pagination[limit]=100&populate[model][populate]=company';

interface Entry {
  type?: string;
  passRate?: number;
  model?: { name?: string; releaseDate?: string };
}

const board: Leaderboard = {
  benchmark: 'onemillion-bench',
  url: 'https://xbench.org/profession/onemillion',
  feed: XBENCH_API + PATH,
  terms: XBENCH_TERMS,
  aliases: {},
  async fetch() {
    const { data } = await xbenchApi<{ data: Entry[] }>(PATH);
    const rows: LeaderboardRow[] = [];
    for (const e of data) {
      const model = e.model?.name?.trim();
      if (!model || typeof e.passRate !== 'number') continue;
      rows.push({ model, score: e.passRate, setting: e.type && e.type !== 'Base' ? e.type : undefined, date: e.model?.releaseDate });
    }
    return rows;
  },
};
export default board;
