// The main README leaderboard ranks judges by the percentage of decisive pairs where they reverse their choice after the order swap.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
import { LECH_MAZUR_ALIASES, lechMazurName } from './nyt-connections-extended.ts';

const feed = "https://raw.githubusercontent.com/lechmazur/position_bias/HEAD/README.md";


const board: Leaderboard = {
  benchmark: "position-bias-lech-mazur",
  url: "https://github.com/lechmazur/position_bias",
  feed,
  terms: "The publisher displays results at https://github.com/lechmazur/position_bias. I could not verify reuse terms. The raw file host serves no robots.txt rules.",
  aliases: LECH_MAZUR_ALIASES,
  async fetch() {
    const source = await fetchText(feed);
    const columns = ["Model", "Order Flip", "First-Shown Pick", "First Lift", "Decisive Pair Coverage", "Rating Bonus"];
    const all = markdownTables(source);
    const table = all.find(t => columns.every(c => t[0]?.includes(c)) && t[0].includes('Rank'));
    if (!table) throw new Error("Missing leaderboard columns");
    const records = table.slice(1).map(cells => Object.fromEntries(table[0].map((k,i) => [k,cells[i]])));
    
    const rows: LeaderboardRow[] = [];
    for (const r of records) {
      const numeric = (key: string) => {
        const text = r[key]?.trim().replace(/[%,$]/g, '');
        if (!text || !Number.isFinite(Number(text))) throw new Error('Invalid ' + key + ' for ' + r["Model"]);
        return Number(text);
      };
      r['First Lift'] = r['First Lift'].replace(/ pp$/, '');
      const row: LeaderboardRow = { model: lechMazurName(r.Model).model, setting: lechMazurName(r.Model).setting, score: numeric("Order Flip") };
      if (!row.model || !Number.isFinite(row.score)) throw new Error('Missing model or score');
      row.metrics = {};
      for (const [key, column] of Object.entries({"firstPick": "First-Shown Pick", "firstLift": "First Lift", "coverage": "Decisive Pair Coverage", "ratingBonus": "Rating Bonus"})) {
        if (r[column] && !/^(?:-|–|—|N\/A)$/i.test(r[column])) row.metrics[key] = numeric(column);
      }
      rows.push(row);
    }
    if (rows.length < 36) throw new Error('Incomplete leaderboard');
    return rows;
  },
};
export default board;
