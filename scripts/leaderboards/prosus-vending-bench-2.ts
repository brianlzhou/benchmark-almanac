// The archived Prosus v2 standings rank the 30-day runs by final bank balance in euros. The pinned README preserves the original scores and API costs.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const feed = "https://raw.githubusercontent.com/ProsusAI/vending-bench/acb3bade01032ec984dbfe8a403b9f1739cfe8dc/results/baselines/models-30d/README.md";


const board: Leaderboard = {
  benchmark: "prosus-vending-bench-2",
  url: "https://github.com/ProsusAI/vending-bench/blob/main/results/baselines/models-30d/README.md",
  feed,
  terms: "Prosus retains the five v2 scores and API costs under Apache 2.0. Only the historical table and chart remain from this batch. https://github.com/ProsusAI/vending-bench/blob/main/README.md The raw file host serves no robots.txt rules.",
  costPer:'run',
  async fetch() {
    const source = await fetchText(feed);
    const columns = ["Model", "Score", "Day", "Final bank", "API cost"];
    const all = markdownTables(source);
    const table = all.find(t => columns.every(c => t[0]?.includes(c)));
    if (!table) throw new Error("Missing leaderboard columns");
    const records = table.slice(1).map(cells => Object.fromEntries(table[0].map((k,i) => [k,cells[i]])));
    
    const rows: LeaderboardRow[] = [];
    for (const r of records) {
      const numeric = (key: string) => {
        const text = r[key]?.trim().replace(/[%,$]/g, '');
        if (!text || !Number.isFinite(Number(text))) throw new Error('Invalid ' + key + ' for ' + r["Model"]);
        return Number(text);
      };
      r.Score=r.Score.replace('€',''); r['Final bank']=r['Final bank'].replace('€','');
      const row: LeaderboardRow = { model: r.Model, trials:1, setting:'30 days, seed 1', harness:'In-process MCP client', score: numeric("Score") };
      if (!row.model || !Number.isFinite(row.score)) throw new Error('Missing model or score');
      row.cost = numeric("API cost");
      rows.push(row);
    }
    if (rows.length < 5) throw new Error('Incomplete leaderboard');
    return rows;
  },
};
export default board;
