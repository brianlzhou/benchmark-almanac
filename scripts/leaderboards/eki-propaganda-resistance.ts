// EKI Propaganda Resistance compares models on an Estonian language task. EKI publishes the percentage scores in the corresponding column of its summary CSV.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const feed = "https://raw.githubusercontent.com/keeleinstituut/leaderboard-data-ui/main/summary.csv";

const board: Leaderboard = {
  benchmark: "eki-propaganda-resistance",
  url: "https://xn--mdupuu-pxaa.eki.ee/benchmark/propaganda_resistance",
  feed,
  terms: "EKI licenses the score data under CC BY 4.0. https://github.com/keeleinstituut/leaderboard-data-ui#license--citation The feed host returns no robots.txt.",
  async fetch() {
    const source = await fetchText(feed);
    const records = parseCsv(source);
    const columns = ["name", "propaganda_resistance"];
    if (!records[0] || !columns.every(key => key in records[0])) throw new Error('Missing result columns');
    const rows: LeaderboardRow[] = [];
    for (const record of records) {
      if (!record["propaganda_resistance"]) continue;
      const model = record["name"].trim();
      const score = Number.parseFloat(record["propaganda_resistance"]);
      if (!model || !Number.isFinite(score)) throw new Error('Missing model or score');
      const row: LeaderboardRow = { model, score };
      if (record.tags.split(',').includes('open')) row.open = true;
      rows.push(row);
    }
    if (rows.length < 101) throw new Error('Incomplete leaderboard');
    return rows;
  },
};
export default board;
