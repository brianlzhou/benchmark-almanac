// RadLE 2.0 (Radiology's Last Exam, CRASH Lab, Ashoka University). crashlab.in/radle/2/leaderboard is a
// static page whose table ("RadLE-C leaderboard data") lists each model with its RadLE-C score, the primary
// RadLE 2.0 metric: net confidence-weighted diagnostic utility on a 0 to 2000 scale. That score is read as is.
// The human expert baseline row is skipped.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const PAGE = 'https://crashlab.in/radle/2/leaderboard';

const board: Leaderboard = {
  benchmark: 'radle-2-0',
  url: PAGE,
  feed: `${PAGE} (static HTML table, RadLE-C score)`,
  terms: 'Static CRASH Lab page; crashlab.in robots.txt allows all agents with content signals search yes, AI training no, use reference.',
  aliases: {
    'Meta Muse Spark 1.1': 'muse-spark-1-1',
    'Mistral Lg 3 2512': 'mistral-large-3',
  },
  async fetch() {
    const t = tables(await fetchText(PAGE)).find((rows) => rows[0]?.map((c) => c.text).join('|') === 'Model|Provider|Score');
    if (!t) throw new Error('RadLE-C table not found');
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(1)) {
      const score = num(r[2]?.text);
      if (r[0]?.text && score !== undefined && !/human/i.test(r[0].text)) rows.push({ model: r[0].text, score });
    }
    return rows;
  },
};
export default board;
