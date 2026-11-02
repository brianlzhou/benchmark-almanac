// Web Clone Bench (Plato). The launch post on plato.so is static HTML with two results tables, "Best
// effort" (one row per model) and "All efforts" (every model at every reasoning effort it was run at):
// #, model with the effort in brackets, full (the share of each app's functionality replicated, averaged
// over the nine apps), avg cost and avg time per run, steps. The importer reads "All efforts", the larger
// table: full is the score, the bracketed effort the setting and avg cost the cost. Each model ran in its
// own vendor's coding harness, which the post does not name per row.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const PAGE = 'https://plato.so/research/web-clone-bench/';

const board: Leaderboard = {
  benchmark: 'web-clone-bench',
  url: PAGE,
  feed: `${PAGE} (static HTML table "All efforts", full)`,
  terms: 'Static research post; plato.so robots.txt allows /research/ (it disallows only /research/preview/ and /api/), and the Plato terms do not restrict reading public pages.',
  async fetch(): Promise<LeaderboardRow[]> {
    const t = tables(await fetchText(PAGE))
      .filter((rows) => rows[0]?.some((c) => c.text === 'full') && rows[0]?.some((c) => c.text === 'avg cost'))
      .sort((a, b) => b.length - a.length)[0];
    if (!t) throw new Error('Web Clone Bench table not found');
    const head = t[0].map((c) => c.text);
    const [iModel, iFull, iCost] = [head.indexOf('model'), head.indexOf('full'), head.indexOf('avg cost')];
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(1)) {
      const cell = r[iModel]?.text ?? '';
      const effort = cell.match(/\s*\[([\w-]+)\]$/);
      const score = num(r[iFull]?.text);
      if (!cell || score === undefined) continue;
      rows.push({
        model: effort ? cell.slice(0, effort.index).trim() : cell,
        score,
        setting: effort?.[1].toLowerCase(),
        cost: num(r[iCost]?.text),
      });
    }
    return rows;
  },
};
export default board;
