// PGG-Bench ranks players by their multi-pass TrueSkill mean in the README. It also reports uncertainty, games played and average final game tokens.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
import { LECH_MAZUR_ALIASES, lechMazurName } from './nyt-connections-extended.ts';

const feed = "https://raw.githubusercontent.com/lechmazur/pgg_bench/HEAD/README.md";


const board: Leaderboard = {
  benchmark: "pgg-bench-lech-mazur",
  stats: { avgFinalTokens: { name: 'Average final tokens', unit: 'tokens' } },
  url: "https://github.com/lechmazur/pgg_bench",
  feed,
  terms: "The publisher displays results at https://github.com/lechmazur/pgg_bench. I could not verify reuse terms. The raw file host serves no robots.txt rules.",
  aliases: LECH_MAZUR_ALIASES,
  async fetch() {
    const source = await fetchText(feed);
    const columns = ["Model", "μ", "σ", "Avg Tokens", "Games"];
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
      
      const row: LeaderboardRow = { model: lechMazurName(r.Model).model, setting: lechMazurName(r.Model).setting, score: numeric("μ") };
      if (!row.model || !Number.isFinite(row.score)) throw new Error('Missing model or score');
      row.trials = numeric("Games");
      row.metrics = {};
      for (const [key, column] of Object.entries({"std": "σ", "avgFinalTokens": "Avg Tokens"})) {
        if (r[column] && !/^(?:-|–|—|N\/A)$/i.test(r[column])) row.metrics[key] = numeric(column);
      }
      rows.push(row);
    }
    if (rows.length < 19) throw new Error('Incomplete leaderboard');
    return rows;
  },
};
export default board;
