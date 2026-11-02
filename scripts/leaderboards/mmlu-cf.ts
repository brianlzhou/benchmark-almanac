// MMLU-CF (Microsoft, contamination-free MMLU). The makers keep the leaderboard as an HTML table in the
// microsoft/MMLU-CF README: per model the original MMLU score and MMLU-CF on its test and validation splits,
// 5-shot and 0-shot. The first MMLU-CF column, 5-shot accuracy on the test split (0 to 100), is the
// headline and the score. Rows that only label a group ("API", "Open-source") are skipped. The table comes
// from the paper (arXiv 2412.15194, December 2024), so rows are dated 2024-12-01 and the resolver picks the
// snapshots current then.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';
import { ghRaw } from './big-bench-extra-hard.ts';

const REPO = 'microsoft/MMLU-CF';
const FEED = ghRaw(REPO, 'README.md');

const board: Leaderboard = {
  benchmark: 'mmlu-cf',
  url: `https://github.com/${REPO}`,
  feed: `${FEED} (Leaderboard table, MMLU-CF 5-shot Test)`,
  terms: 'README table in the microsoft/MMLU-CF GitHub repository, which is MIT-licensed.',
  aliases: {},
  async fetch() {
    const t = tables(await fetchText(FEED)).find((x) => x[1]?.[0]?.text === '5-shot' && x[1]?.[1]?.text === '5-shot Test');
    if (!t) throw new Error('MMLU-CF table not found');
    const rows: LeaderboardRow[] = [];
    // data rows: Model, MMLU (5-shot), MMLU-CF 5-shot Test, ...
    for (const r of t.slice(2)) {
      const score = num(r[2]?.text);
      if (r[0]?.text && score !== undefined) rows.push({ model: r[0].text, score, date: '2024-12-01' });
    }
    return rows;
  },
};
export default board;
