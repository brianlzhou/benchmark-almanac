// StrataBench Land v1 (Collide): Extract accuracy on all ten shared fields of 628 instruments.
// The live dataset card publishes fractions, converted to percentages here. Natural and schema
// are prompt protocols on the same complete benchmark, not separate task subsets. Never include
// the schema-only 14-field diagnostic or average Extract with Classify or Define.
import type { Leaderboard, LeaderboardRow } from '../../leaderboards/types.ts';
import { fetchText } from '../util.ts';

const FEED = 'https://huggingface.co/datasets/Collide-ai/stratabench-land-v1/raw/main/README.md';

export function strataExtractBoard(): Leaderboard {
  return {
    benchmark: 'stratabench-land-v1-extract',
    url: 'https://huggingface.co/datasets/Collide-ai/stratabench-land-v1#baseline-results',
    feed: FEED,
    terms: 'Source: StrataBench Land v1, Collide (https://collide.io); data are CC BY-NC 4.0 with additional permission to publish attributed benchmark scores.',
    async fetch(): Promise<LeaderboardRow[]> {
      const card = await fetchText(FEED);
      const section = card.match(/### Extract: accuracy on the ten shared fields, 628 instruments\s+([\s\S]*?)(?=\n### |\n## |$)/)?.[1];
      if (!section) throw new Error('StrataBench Extract baseline section changed');
      const table = section.split('\n').filter(line => line.trim().startsWith('|'))
        .map(line => line.trim().slice(1, -1).split('|').map(cell => cell.trim().replace(/`/g, '')));
      if (table[0]?.join('|') !== 'Model|natural|schema') throw new Error('StrataBench Extract columns changed');
      const rows: LeaderboardRow[] = [];
      for (const cells of table.slice(2)) {
        if (cells.length !== 3 || !cells[0]) throw new Error('StrataBench Extract invalid row');
        for (const [column, setting] of [[1, 'natural'], [2, 'schema']] as const) {
          if (!/^(?:0?\.\d+|[01](?:\.0+)?)$/.test(cells[column])) throw new Error('StrataBench Extract invalid fraction');
          rows.push({ model: cells[0], setting, score: Number(cells[column]) * 100 });
        }
      }
      if (!rows.length) throw new Error('StrataBench Extract has no published results');
      return rows;
    },
  };
}
