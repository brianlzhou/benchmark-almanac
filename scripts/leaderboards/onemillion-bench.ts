// $OneMillion-Bench (xbench Profession Aligned track). The board at xbench.org/profession/onemillion reads
// /api/one-millions from the xbench Strapi API (see xbench-scienceqa.ts). The importer asks for every row
// rather than the page's top ten. Pass rate (share of tasks that pass the rubric, 0 to 100) is the page's
// sort and the score. Rows typed "Base" are the plain model runs, the only type the board shows. The board's
// other two columns go in `metrics`: the average rubric score ("average", %) and the economic value of the
// passed tasks ("value", US dollars, from economicValue).
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { XBENCH_ALIASES, XBENCH_API, XBENCH_TERMS, xbenchApi } from './xbench-scienceqa.ts';

const PATH = 'one-millions?sort=passRate:desc&pagination[limit]=100&populate[model][populate]=company';

interface Entry {
  type?: string;
  passRate?: number;
  average?: number | null;
  economicValue?: string | number | null;
  model?: { name?: string; releaseDate?: string };
}

const board: Leaderboard = {
  benchmark: 'onemillion-bench',
  url: 'https://xbench.org/profession/onemillion',
  feed: XBENCH_API + PATH,
  terms: XBENCH_TERMS,
  aliases: XBENCH_ALIASES,
  async fetch() {
    const { data } = await xbenchApi<{ data: Entry[] }>(PATH);
    const rows: LeaderboardRow[] = [];
    for (const e of data) {
      const model = e.model?.name?.trim();
      if (!model || typeof e.passRate !== 'number') continue;
      const metrics: Record<string, number> = {};
      if (typeof e.average === 'number') metrics.average = e.average;
      const value = Number(e.economicValue);
      if (e.economicValue != null && e.economicValue !== '' && Number.isFinite(value)) metrics.value = value;
      rows.push({
        model,
        score: e.passRate,
        setting: e.type && e.type !== 'Base' ? e.type : undefined,
        date: e.model?.releaseDate,
        ...(Object.keys(metrics).length ? { metrics } : {}),
      });
    }
    return rows;
  },
};
export default board;
