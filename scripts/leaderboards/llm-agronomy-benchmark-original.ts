// The original agronomy README ranks models by the percentage of multiple-choice questions they answered correctly.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const feed = "https://raw.githubusercontent.com/gbstox/agronomy_llm_benchmarking/3eaa8de8bfdb5cf6584980e5e65cf853216ef1fc/README.md";


const board: Leaderboard = {
  benchmark: "llm-agronomy-benchmark-original",
  url: "https://github.com/gbstox/agronomy_llm_benchmarking/blob/3eaa8de8bfdb5cf6584980e5e65cf853216ef1fc/README.md",
  feed,
  terms: "The repository metadata lists no license. https://github.com/gbstox/agronomy_llm_benchmarking The raw file host serves no robots.txt rules.",
  async fetch() {
    const source = await fetchText(feed);
    const columns = ["Model Name", "Score", "Date Tested"];
    const all = markdownTables(source);
    const table = all.find(t => columns.every(c => t[0]?.includes(c)));
    if (!table) throw new Error("Missing leaderboard columns");
    const records = table.slice(1).map(cells => Object.fromEntries(table[0].map((k,i) => [k,cells[i]])));
    
    const rows: LeaderboardRow[] = [];
    for (const r of records) {
      const numeric = (key: string) => {
        const text = r[key]?.trim().replace(/[%,$]/g, '');
        if (!text || !Number.isFinite(Number(text))) throw new Error('Invalid ' + key + ' for ' + r["Model Name"]);
        return Number(text);
      };
      
      const row: LeaderboardRow = { model: r["Model Name"], score: numeric("Score") };
      if (!row.model || !Number.isFinite(row.score)) throw new Error('Missing model or score');
      row.date = r["Date Tested"];
      rows.push(row);
    }
    if (rows.length < 8) throw new Error('Incomplete leaderboard');
    return rows;
  },
};
export default board;
