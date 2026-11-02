// CRUXEval (Meta FAIR). crux-eval.github.io/leaderboard.html draws two tables from data.csv: output
// prediction (o@1, o@5) and input prediction (i@1, i@5), pass@1 and pass@5 in percent. The output table comes
// first and CRUXEval-O pass@1 is the figure model cards cite most, so o@1 is the score.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const FEED = 'https://crux-eval.github.io/data.csv';

const board: Leaderboard = {
  benchmark: 'cruxeval',
  url: 'https://crux-eval.github.io/leaderboard.html',
  feed: `${FEED} (o@1, CRUXEval-O pass@1)`,
  terms: 'Static CSV on the CRUXEval GitHub Pages site; the cruxeval repository is MIT-licensed.',
  aliases: {},
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const r of parseCsv(await fetchText(FEED))) {
      const score = Number(r['o@1']);
      if (r.Model && Number.isFinite(score)) rows.push({ model: r.Model.trim(), score });
    }
    if (!rows.length) throw new Error('no rows in data.csv');
    return rows;
  },
};
export default board;
