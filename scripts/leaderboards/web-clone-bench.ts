// Web Clone Bench (Plato). The launch post on plato.so is static HTML with two results tables, "Best
// effort" (one row per model) and "All efforts" (every model at every reasoning effort it was run at):
// #, model with the effort in brackets, full (the share of each app's functionality replicated, averaged
// over the nine apps), avg cost and avg time per run, steps. The importer reads "All efforts", the larger
// table: full is the score, the bracketed effort the setting and avg cost the cost. Each model ran in its
// own vendor's coding harness, which the post does not name per row. Avg time ("5h 36m") is kept in seconds
// (`latency`) and steps as `steps`, both per run.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const PAGE = 'https://plato.so/research/web-clone-bench/';

const board: Leaderboard = {
  benchmark: 'web-clone-bench',
  url: PAGE,
  feed: `${PAGE} (static HTML table "All efforts", full)`,
  aliases: {
    'Muse Wonder 1.0': 'muse-wonder',
  },
  terms: 'Static research post; plato.so robots.txt allows /research/ (it disallows only /research/preview/ and /api/), and the Plato terms do not restrict reading public pages.',
  async fetch(): Promise<LeaderboardRow[]> {
    const t = tables(await fetchText(PAGE))
      .filter((rows) => rows[0]?.some((c) => c.text === 'full') && rows[0]?.some((c) => c.text === 'avg cost'))
      .sort((a, b) => b.length - a.length)[0];
    if (!t) throw new Error('Web Clone Bench table not found');
    const head = t[0].map((c) => c.text);
    const [iModel, iFull, iCost, iTime, iSteps] = ['model', 'full', 'avg cost', 'avg time', 'steps'].map((h) => head.indexOf(h));
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(1)) {
      const cell = r[iModel]?.text ?? '';
      const effort = cell.match(/\s*\[([\w-]+)\]$/);
      const score = num(r[iFull]?.text);
      if (!cell || score === undefined) continue;
      const metrics: Record<string, number> = {};
      // "5h 36m", "48m" or "50s"
      const time = r[iTime]?.text ?? '';
      if (iTime >= 0 && /\d\s*[hms]\b/.test(time)) {
        const part = (u: string) => Number(time.match(new RegExp(`(\\d+(?:\\.\\d+)?)\\s*${u}\\b`))?.[1] ?? 0);
        metrics.latency = part('h') * 3600 + part('m') * 60 + part('s');
      }
      const steps = iSteps >= 0 ? num(r[iSteps]?.text) : undefined;
      if (steps !== undefined) metrics.steps = steps;
      rows.push({
        model: effort ? cell.slice(0, effort.index).trim() : cell,
        score,
        setting: effort?.[1].toLowerCase(),
        cost: num(r[iCost]?.text),
        metrics,
      });
    }
    return rows;
  },
};
export default board;
