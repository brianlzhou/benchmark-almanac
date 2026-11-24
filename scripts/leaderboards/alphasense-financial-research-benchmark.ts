// Agents use AlphaSense Search to answer 245 financial research questions.
// The article's model table reports median answer quality relative to a vector-RAG baseline of 1.0.
// The companion chart plots median cost per question without labeling individual costs.
import { tables } from '../lib/html.ts';
import { checked, grid } from '../lib/boards/arxiv-span-tables.ts';
import { fetchText } from '../lib/util.ts';
import type { Leaderboard } from './types.ts';

const url = 'https://www.alpha-sense.com/resources/technical-articles/frontier-ai-models-context/';
const harness = 'AlphaSense Search';

export default {
  benchmark: 'alphasense-financial-research-benchmark',
  url,
  feed: url,
  terms: 'AlphaSense publishes this table under its website terms at https://www.alpha-sense.com/terms/.',
  reference: [harness],
  async fetch() {
    const table = tables(await fetchText(url)).map(grid).find(
      rows => rows[0]?.join('|') === 'Model|Weight|Relative answer quality|Note'
    );
    if (!table) throw new Error('AlphaSense model quality table is missing');
    const rows = table.slice(1).map(([model, weight, quality]) => {
      if (!['Open', 'Proprietary'].includes(weight) || !quality?.trim()) {
        throw new Error(`Invalid AlphaSense result for ${model}`);
      }
      return { model, score: Number(quality), open: weight === 'Open', harness };
    });
    return checked(rows, 9);
  },
} satisfies Leaderboard;
