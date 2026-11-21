// The Hanabi Agent Benchmark ranks agents by mean progress out of 25. Its baseline CSV reports four seed scores for each effort setting.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const feed = "https://huggingface.co/datasets/realset/hanabi-agent-bench/raw/main/results/baseline_scores.csv";

const board: Leaderboard = {
  benchmark: "hanabi-agent-benchmark",
  url: "https://huggingface.co/datasets/realset/hanabi-agent-bench/blob/main/report/en/report.md",
  feed,
  terms: "The dataset uses CC BY 4.0. Credit the authors and indicate changes. https://huggingface.co/datasets/realset/hanabi-agent-bench/blob/main/LICENSE The feed host publishes robots.txt at https://huggingface.co/robots.txt.",
  parts: {"seed101": "Seed 101", "seed102": "Seed 102", "seed103": "Seed 103", "seed104": "Seed 104"},
  async fetch() {
    const source = await fetchText(feed);
    const records = parseCsv(source);
    const columns = ["model", "mean_progress", "seed101", "seed102", "seed103", "seed104", "deck_exhausted", "lives_exhausted"];
    if (!records[0] || !columns.every(key => key in records[0])) throw new Error('Missing result columns');
    const rows: LeaderboardRow[] = [];
    for (const record of records) {
      const model = record["model"].trim();
      const score = Number.parseFloat(record["mean_progress"]);
      if (!model || !Number.isFinite(score)) throw new Error('Missing model or score');
      const row: LeaderboardRow = { model, score };
      row.metrics = {};
      for (const [column, key] of Object.entries({"seed101": "seed101", "seed102": "seed102", "seed103": "seed103", "seed104": "seed104", "deck_exhausted": "deckExhausted", "lives_exhausted": "livesExhausted"})) {
        const value = Number.parseFloat(record[column]);
        if (Number.isFinite(value)) row.metrics[key] = value;
      }
      row.setting = record.effort;
      row.trials = 4;
      rows.push(row);
    }
    if (rows.length < 21) throw new Error('Incomplete leaderboard');
    return rows;
  },
};
export default board;
