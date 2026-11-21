// FinDesk-Bench ranks finance agents by pass@1 across three attempts. The published table includes intervals, all-three success, cost and effort.
// The table reports all-three success as pass^3.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';

const feed = "https://veris.ai/leaderboard/findesk";

const board: Leaderboard = {
  benchmark: "findesk-bench",
  url: "https://veris.ai/leaderboard/findesk",
  feed,
  terms: "Veris reserves all rights. The public terms give no separate permission to reproduce leaderboard tables. https://veris.ai/terms-and-conditions The robots.txt rules allow the leaderboard.",
  stats: { pass3: { name: 'Pass@3', unit: '%', better: 'higher' } },
  async fetch() {
    const t = tables(await fetchText(feed)).find(t => t[0]?.[1]?.text.includes('pass@1'));
    if (!t || t.length < 17 || t[0].length !== 7 || !t[0][2].text.includes('95%') || t[0][5].text !== 'Harness') throw new Error('Missing FinDesk results');
    return t.slice(1).map(r => {
      const interval = r[2].text.match(/([\d.]+)\s*(?:[–-]|&ndash;)\s*([\d.]+)/);
      const score = num(r[1].text), pass3 = num(r[3].text), cost = num(r[4].text);
      if (!r[0].text || score == null || pass3 == null || cost == null || !interval) throw new Error('Incomplete FinDesk row');
      return { model: r[0].text, score, low: Number(interval[1]), high: Number(interval[2]), trials: 3, cost,
        harness: r[5].text, setting: r[6].text, metrics: { pass3 } };
    });
  },
};

export default board;
