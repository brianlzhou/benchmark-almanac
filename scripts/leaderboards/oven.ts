// OVEN tests recognition of Wikipedia entities in images given a question.
// Table 2 reports the overall test harmonic mean across seen and unseen entities and queries.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const feed = "https://arxiv.org/html/2302.11154";
const header = ["", "# Params", "seen", "unseen", "seen", "unseen", "hm", "seen", "unseen", "hm"];
const columns: Record<string, number> = {"entitySeen": 2, "entityUnseen": 3, "querySeen": 4, "queryUnseen": 5, "humanEvalSeen": 7, "humanEvalUnseen": 8, "humanEvalHM": 9};
const board: Leaderboard = {
  benchmark: "oven", url: feed, feed, static: 'paper',
  terms: "The authors publish this table under the terms linked at https://arxiv.org/abs/2302.11154." ,
  parts: {"entitySeen": "Entity split seen", "entityUnseen": "Entity split unseen", "querySeen": "Query split seen", "queryUnseen": "Query split unseen", "humanEvalSeen": "Human evaluation split seen", "humanEvalUnseen": "Human evaluation split unseen", "humanEvalHM": "Human evaluation split harmonic mean"},
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const table = tables.find(t => t[1]?.join('|') === header.join('|') && t[0][6].includes('Test'));
    if (!table) throw new Error('The reviewed results table is missing');
    const rows: LeaderboardRow[] = [];
    const numeric = (s: string) => numberCell(s.replace(/\s+/g, ''));
    for (const row of table.slice(2)) {
      if (row[0].endsWith(':') || row[0].startsWith('Human+Search')) continue;
      const model = row[0].replace('_{\\texttt{ViTL14}}', ' ViT-L/14');
      const metrics = Object.fromEntries(Object.entries(columns).map(([key, i]) => [key, numeric(row[i])]));
      const score = numeric(row[6]);
      rows.push({ model, score, metrics, params: numeric(row[1].replace(/B$/, '')) });
    }
    return checked(rows, 5);
  },
};
export default board;
