// HY3D-Bench tests image-to-3D generation on 400 held-out objects.
// Table 2 gives Uni3D-I and ULIP-I alignment. The first metric is the headline.
import type { Leaderboard, LeaderboardRow } from "./types.ts";
import { checked, grid, paperTables } from "../lib/boards/arxiv-span-tables.ts";
import { paperHtml } from "../lib/boards/arxiv-throttled.ts";

const feed = "https://arxiv.org/html/2602.03907";
const board: Leaderboard = {
  benchmark: "hy3d-bench",
  url: feed, feed, static: "paper",
  terms: "The authors publish the paper under the terms linked at https://arxiv.org/abs/2602.03907",
  stats: { ulip: { name: 'ULIP-I', unit: 'score', better: 'higher' }, tokenLength: { name: 'Token length', unit: 'tokens' } },
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const t = tables.find(t => t[0][0] === 'Methods' && t[0][1] === 'Token length' && t[0][2] === 'Model Size (M)' && t[0][3]?.startsWith('Uni3D-I') && t[0][4]?.startsWith('ULIP-I'));
    if (!t) throw new Error('Missing Table 2 alignment scores');
    return checked(t.slice(1).map(([label, length, params, primary, other]) => {
      const model = label === 'Ours' ? 'Hunyuan3D-2.1-Small' : label.replace(/ [^ ]+ et al\..*$/, '');
      const tokenLength = Number(length.replace(/\*$/, ''));
      if (![tokenLength, Number(params), Number(other)].every(Number.isFinite)) throw new Error('Invalid 3D result');
      return { model, score: Number(primary), params: Number(params)/1000, metrics: { ulip: Number(other), tokenLength } };
    }), 5);
  },
};
export default board;
