// Ego-MC-Bench evaluates interventions during cooking. The project tables give mistake detection F1 for stepwise and full-recipe evaluations.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';

const feed = "https://apratimbh.github.io/livecookv2/";

const board: Leaderboard = {
  benchmark: "ego-mc-bench",
  url: "https://apratimbh.github.io/livecookv2/",
  feed,
  terms: "The project page gives no separate score reuse terms. https://apratimbh.github.io/livecookv2/ The feed host publishes robots.txt at https://apratimbh.github.io/robots.txt.",
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const table of tables(await fetchText(feed))) {
      if (!table[1]?.[4]?.text.startsWith('F1')) continue;
      let setting = '';
      for (const cells of table.slice(2)) {
        if (cells.length === 1) { setting = cells[0].text; continue; }
        const [model, ...values] = cells.map(c => c.text);
        const [instructionAccuracy, precision, recall, score, bert, rougeL] = values.map(Number.parseFloat);
        if (!setting || !model || ![instructionAccuracy, precision, recall, score, bert, rougeL].every(Number.isFinite)) throw new Error('Invalid cooking result');
        rows.push({ model, setting, score, metrics: { instructionAccuracy, precision, recall, bert, rougeL } });
      }
    }
    if (rows.length < 24) throw new Error('Incomplete cooking tables');
    return rows;
  },
};
export default board;
