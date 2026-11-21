// ABACUS tests whether image editors add, remove or change the requested number of objects.
// The leaderboard score multiplies count fidelity, scene consistency and conservation across 10,944 edits.
import type { Leaderboard } from './types.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { fetchText } from '../lib/util.ts';

const feed = 'https://raw.githubusercontent.com/CEA-LIST/ABACUS/HEAD/README.md';
const operations = ['Add', 'Remove', 'Change'];
const tiers = ['Easy', 'Medium', 'Hard'];
const board: Leaderboard = {
  benchmark: 'abacus', feed, url: 'https://cea-list.github.io/ABACUS/#leaderboard',
  aliases: { 'FLUX.1 Kontext': 'flux-1-kontext-dev' },
  terms: 'The ABACUS authors use CC BY 4.0, https://github.com/CEA-LIST/ABACUS/blob/HEAD/LICENSE.',
  parts: Object.fromEntries(operations.flatMap(op => tiers.map(tier => [op + tier, op + ': ' + tier]))),
  async fetch() {
    const tables = markdownTables(await fetchText(feed));
    const main = tables.find(t => t[0].join('|') === 'Model|Type|Count fidelity|Scene consistency|Conservation|Score');
    const splits = tables.find(t => t[0].join('|') === ['Model', ...operations].join('|'));
    if (!main || !splits) throw new Error('Missing ABACUS leaderboard columns');
    return checked(main.slice(1).map(([model, type, cf, sc, oc, score]) => {
      const metrics: Record<string, number> = { countFidelity: Number(cf), sceneConsistency: Number(sc), conservation: Number(oc) };
      const row = splits.find(r => r[0] === model);
      if (!row) throw new Error('Missing breakdown for ' + model);
      for (const [i, op] of operations.entries()) {
        const values = row[i + 1].split(/\s*\/\s*/);
        if (values.length !== 3) throw new Error('Missing difficulty tier for ' + model);
        tiers.forEach((tier, j) => { metrics[op + tier] = Number(values[j]); });
      }
      if (!Object.values(metrics).every(Number.isFinite)) throw new Error('Invalid ABACUS metric');
      return { model, open: type === 'Open', score: Number(score), metrics };
    }), 7);
  },
};
export default board;
