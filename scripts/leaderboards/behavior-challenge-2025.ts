// Archived 2025 held-out Q-score, converted from fraction to percent.
// Team names identify evaluated systems and remain unlisted. Validation-only submissions are not test results.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';
const URL = 'https://behavior.stanford.edu/challenge/archive/2025/leaderboard.html';
const board: Leaderboard = {
  benchmark: 'behavior-challenge-2025', url: URL, feed: URL,
  terms: 'The official BEHAVIOR archive publishes challenge results; source terms apply and the Almanac credits and links the source.',
  async fetch() {
    const table = tables(await fetchText(URL)).find(t=>t[0].some(c=>c.text.includes('Q Score')));
    if (!table) throw new Error('BEHAVIOR 2025 table missing');
    const rows: LeaderboardRow[] = [];
    for (const r of table.slice(2)) {
      const score = num(r[8]?.text);
      if (r.length !== 10 || score === undefined) continue;
      const metrics: Record<string, number> = {};
      for (const [i,key] of [[5,'validationSuccess'],[6,'testSuccess'],[7,'validationQScore']] as const) {
        const n = num(r[i].text); if (n !== undefined) metrics[key] = n*100;
      }
      const date = r[9].text.replace(/^(\d{4})(\d\d)(\d\d)$/, '$1-$2-$3');
      rows.push({model: `${r[1].text} (BEHAVIOR 2025 team)`, score:score*100, setting:r[3].text, date, metrics});
    }
    if (!rows.length) throw new Error('No held-out BEHAVIOR 2025 scores');
    return rows;
  },
};
export default board;
