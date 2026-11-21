// MeasEval ranks each team by its best overall F1. Table 2 of the organizers’ report also gives six component scores.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const feed = "https://aclanthology.org/2021.semeval-1.38.pdf";

const board: Leaderboard = {
  benchmark: "measeval", static: 'paper',
  url: "https://competitions.codalab.org/competitions/25770#results",
  feed,
  terms: "The publisher does not specify separate score reuse terms in the supplied source. The feed host returns no robots.txt.",
  parts: {"Quantity": "Quantity", "Unit": "Unit", "Modifier": "Modifier", "MeasuredEntity": "MeasuredEntity", "MeasuredProperty": "MeasuredProperty", "Qualifier": "Qualifier"},
  async fetch() {
    const source = await pdfText(feed);
    const match = /Team Name\s+Overall\s+Quantity\s+Unit\s+Modifier\s+MeasuredEntity\s+MeasuredProperty\s+Qualifier([\s\S]*?)Table 2:/.exec(source);
    if (!match) throw new Error('Missing MeasEval Table 2');
    const rows: LeaderboardRow[] = [];
    for (const line of match[1].trim().split('\n')) {
      if (!line.trim()) continue;
      const values = line.trim().split(/\s+/);
      const scores = values.splice(-7).map(v => Number.parseFloat(v) * 100);
      const model = values.join(' ').replace(/\*$/, '');
      if (!model || !scores.every(Number.isFinite)) throw new Error('Invalid MeasEval entry');
      const [score, ...parts] = scores;
      rows.push({ model, score, submitter: model, metrics: Object.fromEntries(Object.keys(board.parts!).map((key, i) => [key, parts[i]])) });
    }
    if (rows.length < 20) throw new Error('Incomplete MeasEval table');
    return rows;
  },
};
export default board;
