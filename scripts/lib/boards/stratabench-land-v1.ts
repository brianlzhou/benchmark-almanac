// StrataBench Land v1 (Collide): Extract accuracy on the ten fields shared by all four prompt conditions, over the
// same 628 instruments, converted from fractions to percentages. Collide withdrew the v1 dataset card that this
// board first read (it answers 401 since 2026-11-09). The paper in the v2 repository, which the v2 card names as the
// source for v1, gives the same experiment in Table 10 with all four conditions: natural, rules only, fields only
// (the v1 card's "schema" column, with the same values) and full. Its natural values differ from the withdrawn card
// by up to 6 points, and the paper's are used. The conditions are prompt protocols on the same complete benchmark,
// not task subsets. Never include the 14-field diagnostic or average Extract with Classify or Define.
import type { Leaderboard, LeaderboardRow } from '../../leaderboards/types.ts';
import { pdfText } from './pdf-text.ts';

const DATASET = 'https://huggingface.co/datasets/Collide-ai/stratabench-land-v2';
const FEED = DATASET + '/resolve/main/oilbench_landscape_1.pdf';
const CONDITIONS = ['natural', 'rules only', 'fields only', 'full'];

export function strataExtractBoard(): Leaderboard {
  return {
    benchmark: 'stratabench-land-v1-extract',
    url: FEED,
    feed: `${FEED} (Table 10)`,
    static: 'paper',
    terms: 'Source: StrataBench, Collide (https://collide.io); Collide publishes the paper in its CC BY-NC 4.0 dataset repository with permission to publish attributed benchmark scores. ' + DATASET,
    async fetch(): Promise<LeaderboardRow[]> {
      const pdf = await pdfText(FEED);
      const before = pdf.split('Table 10: Accuracy on the ten fields');
      if (before.length !== 2) throw new Error('StrataBench Extract Table 10 missing');
      const block = before[0].split(/Model\s+Natural\s+Rules only\s+Fields only\s+Full/).at(-1)!;
      if (block === before[0]) throw new Error('StrataBench Extract columns changed');
      const rows: LeaderboardRow[] = [];
      for (const line of block.trim().split('\n')) {
        const cells = line.trim().split(/\s{2,}/);
        if (cells.length !== 5 || !cells.slice(1).every(c => /^\.\d{3}$/.test(c))) throw new Error('StrataBench Extract invalid row: ' + line.trim());
        CONDITIONS.forEach((setting, i) => rows.push({ model: cells[0], setting, score: Number((Number(cells[i + 1]) * 100).toFixed(1)) }));
      }
      if (rows.length < 20) throw new Error('StrataBench Extract has too few results');
      return rows;
    },
  };
}
