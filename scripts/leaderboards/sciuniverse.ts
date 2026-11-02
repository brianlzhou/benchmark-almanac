// SciUniverse (C5R). c5r.net/sciuniverse is a static page whose first table lists each model with its
// effort, Pass@1 (averaged across the task families, 0 to 100) and cost per task. Pass@1 is the score, the
// effort the setting and the cost per task kept.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const URL = 'https://c5r.net/sciuniverse/';

const board: Leaderboard = {
  benchmark: 'sciuniverse',
  url: URL,
  feed: `${URL} (static HTML table, Pass@1)`,
  terms: 'Static public page; robots.txt only disallows /jobs/ and the site states no terms.',
  aliases: {},
  async fetch() {
    const t = tables(await fetchText(URL)).find((rows) => rows[0]?.some((c) => c.text === 'Pass@1'));
    if (!t) throw new Error('SciUniverse table not found');
    const iScore = t[0].findIndex((c) => c.text === 'Pass@1');
    const iCost = t[0].findIndex((c) => /^Cost/.test(c.text));
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(1)) {
      // "GPT 6 Astra xhigh" may be written with an en dash (U+2013) for the hyphen, and the effort comes last
      const cell = (r[0]?.text ?? '').replace(/–/g, '-');
      const effort = cell.match(/\s+(low|medium|high|xhigh|max)$/i);
      const score = num(r[iScore]?.text);
      if (!cell || score === undefined) continue;
      rows.push({
        model: effort ? cell.slice(0, effort.index).trim() : cell,
        score,
        setting: effort?.[1].toLowerCase(),
        cost: iCost >= 0 ? num(r[iCost]?.text) : undefined,
      });
    }
    return rows;
  },
};
export default board;
