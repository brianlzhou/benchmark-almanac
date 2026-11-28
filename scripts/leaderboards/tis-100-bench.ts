// TIS-100 Bench counts puzzles where a model improves the community frontier. The authors publish the leaderboard and tie-breaking measures in models.csv.
import type { Leaderboard } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const feed = "https://raw.githubusercontent.com/wincon-research/tis100-bench/main/models.csv";
const board: Leaderboard = {
  benchmark: "tis-100-bench",
  url: "https://tis-100.wincon.dev/#leaderboard",
  feed,
  terms: "The repository uses MIT and requests credit to Wincon and the model for programs. The site permits crawling and the raw file host has no robots.txt.",
  parts: {"points":"New frontier points","solved":"Puzzles solved","proximity":{"name":"Record proximity","unit":"%"}},
  aliases: {"Opus 5.5":"claude-opus-5-5","Sonnet 5.5":"claude-sonnet-5-5","Fable 5.1":"claude-fable-5-1","Haiku 5.5":"claude-haiku-5-5"},
  async fetch() {
    const source = await fetchText(feed);
    const headers = ["model","puzzles_with_new_frontier_points","new_frontier_points","puzzles_solved","record_proximity"];
    const records = parseCsv(source);
    if (headers.some(h => !(h in (records[0] ?? {})))) throw new Error('Missing results columns');
    const numeric = (s: string) => {
      const value = s?.replace(/%$/, '').trim();
      if (!value || !Number.isFinite(Number(value))) throw new Error('Invalid result: ' + s);
      return Number(value);
    };
    const rows = records.map(r => {
      const model = r["model"];
      if (!model) throw new Error('Missing model name');
      return { model, score: numeric(r["puzzles_with_new_frontier_points"]),
        metrics: { points: numeric(r["new_frontier_points"]), solved: numeric(r["puzzles_solved"]), proximity: numeric(r["record_proximity"]) } };
    });
    if (rows.length < 16) throw new Error('Incomplete results');
    return rows;
  },
};
export default board;
