// PoETa v2 compares performance on Portuguese language tasks.
// The importer reads the authors' Markdown results table and ranks by Poeta V2.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const feed = "https://raw.githubusercontent.com/PoETaV2/PoETaV2/HEAD/README.md";
const board: Leaderboard = {
  benchmark: "poeta-v2", url: "https://github.com/PoETaV2/PoETaV2#poeta-v2-leaderboard", feed,
  terms: "The benchmark authors publish this leaderboard in their public project README.",
  async fetch() {
    const source = await fetchText(feed);
    const all = markdownTables(source);
    const table = all.find(t => t[0]?.join('|') === "Model|Pretrain size|Model size|Compute Cost|Poeta V2");
    if (!table) throw new Error('Results columns changed');
    const rows: LeaderboardRow[] = [];
    for (const cells of table.slice(1)) {
      const model = cells[0];
      const number = (i: number) => {
        const raw = cells[i]?.trim().replace(/%$/, '');
        if (!raw || !Number.isFinite(Number(raw))) throw new Error(`Invalid score for ${model}`);
        return Number(raw);
      };
      if (cells.slice(1).every(c => !c)) continue;
      rows.push({ model, score: number(4), params: cells[2] === '-' ? undefined : parseFloat(cells[2]), metrics: cells[3] === '-' ? {} : { computeCost: number(3) } });
    }
    if (rows.length < 27) throw new Error('Expected at least 27 published results');
    return rows;
  },
};
export default board;
