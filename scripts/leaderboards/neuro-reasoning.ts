// Models answer generated EEG reasoning questions. The repository reports accuracy on 175 held-out items.
// The heldout table gives five task families, overall accuracy with a 95% interval and format compliance.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://raw.githubusercontent.com/Dwin2/neuro-reasoning/HEAD/docs/RESULTS.md';
const board: Leaderboard = {
  benchmark: 'neuro-reasoning', url: 'https://github.com/Dwin2/neuro-reasoning/blob/HEAD/docs/RESULTS.md', feed,
  terms: 'The author publishes the results on GitHub under https://docs.github.com/en/site-policy/github-terms/github-terms-of-service.',
  parts: { filter_design: 'Filter design', power: 'Power', split_hygiene: 'Split hygiene', epoch_rejection: 'Epoch rejection', pipeline_order: 'Pipeline order' },
  stats: { formatOK: { name: 'Format OK', unit: '%', better: 'higher' } },
  async fetch() {
    const section = (await fetchText(feed)).split('### Accuracy (%), heldout split, 35 items per family cell')[1]?.split('\n###')[0];
    const [table] = markdownTables(section || '');
    if (table?.[0].join('|') !== 'Model|filter_design|power|split_hygiene|epoch_rejection|pipeline_order|All (95% CI)|Format OK') throw new Error('Missing held-out score columns');
    return checked(table.slice(1).map(r => {
      const bounds = r[6].match(/^(\d+) \((\d+) to (\d+)\)$/);
      if (!bounds) throw new Error('Missing overall accuracy or interval');
      const metrics = Object.fromEntries(table[0].slice(1, 6).map((key, i) => [key, Number(r[i + 1])]));
      metrics.formatOK = Number(r[7]);
      return { model: r[0], setting: '4-bit weights, temperature 0', score: Number(bounds[1]), low: Number(bounds[2]), high: Number(bounds[3]), metrics };
    }), 3);
  },
};
export default board;
