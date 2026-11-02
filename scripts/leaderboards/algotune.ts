// AlgoTune. algotune.io is a static page whose first table is the model leaderboard: Model Name (with the
// reasoning effort in brackets) and AlgoTune Score, the harmonic mean speedup over the reference solvers
// across the 154 tasks ("2.05x"). The speedup is the score and the effort the setting. The second table
// lists the best speedups per task and is not read.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const URL = 'https://algotune.io/';

const board: Leaderboard = {
  benchmark: 'algotune',
  url: URL,
  feed: `${URL} (static HTML table, AlgoTune Score)`,
  terms: 'Static public page; the site publishes no robots.txt and no terms, and the AlgoTune repository is MIT-licensed.',
  aliases: {},
  async fetch() {
    const t = tables(await fetchText(URL)).find((rows) => rows[0]?.some((c) => c.text === 'AlgoTune Score'));
    if (!t) throw new Error('AlgoTune table not found');
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(1)) {
      const cell = r[0]?.text ?? '';
      const effort = cell.match(/\s*\(([\w-]+)\)$/);
      const score = num(r[1]?.text);
      if (!cell || score === undefined) continue;
      rows.push({ model: effort ? cell.slice(0, effort.index).trim() : cell, score, setting: effort?.[1].toLowerCase() });
    }
    return rows;
  },
};
export default board;
