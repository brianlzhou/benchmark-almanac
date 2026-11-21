// DEAL ranks astrophysics entity recognition submissions by overall F1. The CodaLab test CSV names entrants by username.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const feed = "https://codalab.lisn.upsaclay.fr/competitions/5062/results/7691/data";

const board: Leaderboard = {
  benchmark: "deal-astrophysics-ner",
  url: "https://codalab.lisn.upsaclay.fr/competitions/5062#results",
  feed,
  terms: "The competition lists its terms as to be announced. Its test CSV identifies entrants by username. https://codalab.lisn.upsaclay.fr/competitions/5062 The feed host returns no robots.txt.",
  stats: { mcc: { name: 'Matthews correlation coefficient', unit: 'score', better: 'higher' } },
  async fetch() {
    const source = await fetchText(feed);
    const records = parseCsv(source);
    const columns = ["User", "b'overall_f1'", "b'mcc'"];
    if (!records[0] || !columns.every(key => key in records[0])) throw new Error('Missing result columns');
    const rows: LeaderboardRow[] = [];
    for (const record of records) {
      const model = record["User"].trim();
      const score = Number.parseFloat(record["b'overall_f1'"]);
      if (!model || !Number.isFinite(score)) throw new Error('Missing model or score');
      const row: LeaderboardRow = { model, score };
      row.metrics = {};
      for (const [column, key] of Object.entries({"b'mcc'": "mcc"})) {
        const value = Number.parseFloat(record[column]);
        if (Number.isFinite(value)) row.metrics[key] = value;
      }
      row.submitter = model;
      rows.push(row);
    }
    if (rows.length < 13) throw new Error('Incomplete leaderboard');
    return rows;
  },
};
export default board;
