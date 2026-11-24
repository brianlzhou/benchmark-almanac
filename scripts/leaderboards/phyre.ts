// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// Table 1(a) reports area under the success-percentage curve on one-ball and two-ball puzzles for each generalization setting.
import type { Leaderboard, LeaderboardRow } from "./types.ts";
import { checked, grid, paperTables } from "../lib/boards/arxiv-span-tables.ts";
import { paperHtml } from "../lib/boards/arxiv-throttled.ts";

const feed = "https://arxiv.org/html/1908.05656";
const board: Leaderboard = {
  benchmark: "phyre",
  url: feed, feed, static: "paper",
  terms: "The authors publish the paper under the terms linked at https://arxiv.org/abs/1908.05656",
  headline: 'For each generalization setting, this is the plain mean of PHYRE-B and PHYRE-2B AUCCESS.',
  parts: { ball: 'PHYRE-B', twoBalls: 'PHYRE-2B' },
  stats: { ballStd: { name: 'PHYRE-B standard deviation', unit: '%' }, twoBallsStd: { name: 'PHYRE-2B standard deviation', unit: '%' }, ballAt10: { name: 'PHYRE-B success at 10 attempts', unit: '%' }, twoBallsAt10: { name: 'PHYRE-2B success at 10 attempts', unit: '%' } },
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const pair = tables.filter(t => t[0].join('|') === '|PHYRE-B|PHYRE-B|PHYRE-2B|PHYRE-2B' && t[1].join('|') === '|Cross|Within|Cross|Within');
    if (pair.length !== 2) throw new Error('Missing Table 1 AUCCESS or success percentage');
    const rows: LeaderboardRow[] = [];
    const values = (s: string) => {
      const m = s.match(/^(\d+\.\d+) \\pm (\d+\.\d+)(?: \*)?$/);
      if (!m) throw new Error('Invalid PHYRE score');
      return [Number(m[1]), Number(m[2])];
    };
    for (const r of pair[0].slice(2)) {
      if (r[0] === 'RAND') continue;
      const at10 = pair[1].find(line => line[0] === r[0]);
      if (!at10) throw new Error('Missing success percentage');
      for (const i of [1,2]) {
        if (r[i] === '-' || r[i+2] === '-') continue;
        const [ball, ballStd] = values(r[i]), [twoBalls, twoBallsStd] = values(r[i+2]);
        rows.push({ model: r[0], setting: pair[0][1][i] + '-template', score: (ball+twoBalls)/2,
          metrics: { ball, twoBalls, ballStd, twoBallsStd, ballAt10: values(at10[i])[0], twoBallsAt10: values(at10[i+2])[0] } });
      }
    }
    return checked(rows, 6);
  },
};
export default board;
