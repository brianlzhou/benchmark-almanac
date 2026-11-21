// MPIE-Bench evaluates whether edits preserve interacting people's bodies and identities. Table 3 gives six Track A scores on 2,500 edits at native resolution.
// The protocol gives no overall score. Anatomy is the first axis, and HPSv2 quality uses a different scale.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const feed = "https://arxiv.org/html/2607.27616";
const header = ["Model", "Anat", "Inter", "Count", "ID", "Instr", "Qual"];
const columns: Record<string, number> = {"Anat": 1, "Inter": 2, "Count": 3, "ID": 4, "Instr": 5, "Qual": 6};
const board: Leaderboard = {
  benchmark: "mpie-bench", url: feed, feed, static: 'paper',
  terms: "The authors publish this table under the terms linked at https://arxiv.org/abs/2607.27616." ,
  parts: {"Anat": "Anatomy", "Inter": "Interaction", "Count": "Count", "ID": "Identity", "Instr": "Instruction", "Qual": {"name": "Quality", "unit": "score", "note": "Raw HPSv2 score."}},
  headline: "The public track reports six separate measures, so the headline is its first measure, anatomy.",
  aliases: {"BAGEL": "bagel-7b-mot", "Seedream-5-Pro": "seedream-5-0-pro", "FLUX.1-Kontext": "flux-1-kontext-dev"},
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const table = tables.find(t => t[0]?.join('|') === header.join('|'));
    if (!table) throw new Error('The reviewed results table is missing');
    const rows: LeaderboardRow[] = [];
    for (const row of table.slice(1)) {
      const model = row[0].split(' ')[0];
      const metrics = Object.fromEntries(Object.entries(columns).map(([key, i]) => [key, numberCell(row[i])]));
      const score = metrics.Anat;
      rows.push({ model, score, metrics, setting: 'Track A, native resolution' });
    }
    return checked(rows, 10);
  },
};
export default board;
