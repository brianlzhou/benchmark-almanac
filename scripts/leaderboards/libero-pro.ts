// LIBERO-PRO (generalization of vision-language-action policies). The makers keep the leaderboard as an HTML
// table under "LIBERO-Pro Model Leaderboard" in the Zxy-MLlab/LIBERO-PRO README: normalized success rates
// (0 to 1) under five perturbations on four LIBERO suites, and "Total", the last column. Total times 100 is the
// score.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';
import { ghRaw } from './big-bench-extra-hard.ts';

const REPO = 'Zxy-MLlab/LIBERO-PRO';
const FEED = ghRaw(REPO, 'README.md', 'master');

const board: Leaderboard = {
  benchmark: 'libero-pro',
  url: `https://github.com/${REPO}#-libero-pro-model-leaderboard`,
  feed: `${FEED} (LIBERO-Pro Model Leaderboard, Total)`,
  terms: 'README table in the Zxy-MLlab/LIBERO-PRO GitHub repository, which is MIT-licensed.',
  aliases: {
    Pi0: 'pi0',
    'Pi0.5': 'pi0-5',
  },
  async fetch() {
    const t = tables(await fetchText(FEED)).find((x) => x[0]?.[0]?.text === 'Model' && x[0].some((c) => c.text === 'Total'));
    if (!t) throw new Error('LIBERO-PRO leaderboard table not found');
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(2)) {
      const total = num(r.at(-1)?.text);
      if (r[0]?.text && total !== undefined) rows.push({ model: r[0].text, score: total * 100, metrics: Object.fromEntries(r.slice(1,-1).flatMap((c,i)=>{const v=num(c.text);return v===undefined?[]:[[(t[0][Math.floor(i/5)+1].text+'-'+t[1][i].text),v*100]];})) });
    }
    return rows;
  },
};
export default board;
