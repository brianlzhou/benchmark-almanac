// The VAR cooking challenge scores instruction completion accuracy in percent. The workshop page lists winners and the four reference methods.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';

const feed = "https://varworkshop.github.io/challenges/";

const board: Leaderboard = {
  benchmark: "qualcomm-interactive-cooking",
  url: "https://varworkshop.github.io/challenges/",
  feed,
  terms: "The workshop page gives no separate score reuse terms. https://varworkshop.github.io/challenges/ The feed host publishes robots.txt at https://varworkshop.github.io/robots.txt.",
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const table of tables(await fetchText(feed))) {
      if (!table[0]?.[1]?.text.startsWith('IC-Acc')) continue;
      for (const cells of table.slice(1)) {
        const [model, ...values] = cells.map(c => c.text);
        const [score, precision, recall, f1, bert, rougeL] = values.map(Number.parseFloat);
        if (!model || ![score, precision, recall, f1, bert, rougeL].every(Number.isFinite)) throw new Error('Invalid cooking score');
        rows.push({ model, score, submitter: table[0][0].text === 'Team' ? model : undefined, metrics: { precision, recall, f1, bert, rougeL } });
      }
    }
    if (rows.length < 6) throw new Error('Incomplete cooking results');
    return rows;
  },
};
export default board;
