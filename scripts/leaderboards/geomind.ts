// GeoMind tests whether embodied agents can reason about and remember spatial relationships.
// Table 2 reports average task success on GeoMind-Base. Table 3 tests six policies on augmented tasks.
import type { Leaderboard } from './types.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2611.12175';
const families = ['Target Iden.', 'Relational Grounding', 'Constraint Comp.', 'Geometric Inference', 'Scene Updating', 'Identity Tracking'];
const conditions = ['Corresponding Base', 'Semantic', 'Visual', 'Execution'];
const board: Leaderboard = {
  benchmark: 'geomind', url: feed, feed, static: 'paper',
  terms: 'The authors publish these tables under the terms linked at https://arxiv.org/abs/2611.12175.',
  parts: Object.fromEntries([
    ...families.map(name => [name, { name, group: 'GeoMind-Base' }]),
    ...conditions.map(name => [name, { name, group: 'GeoMind-Aug' }]),
  ]),
  aliases: { 'π0': 'pi0', 'π0.5': 'pi0-5' },
  harnesses: 'system',
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const base = tables.find(t => t[0]?.[0] === 'Embodied Agents' && t[1]?.slice(3).join('|') === [...families, 'AVG'].join('|'));
    const aug = tables.find(t => t[0]?.join('|') === ['Policies', ...conditions].join('|'));
    if (!base || !aug || aug.length !== 7) throw new Error('Missing GeoMind results columns or policies');
    const rows = base.slice(2).filter(r => r[1] !== 'Oracle').map(r => {
      const model = r[2].replace(/^\\pi_\{([\d.]+)\}$/, 'π$1');
      const metrics = Object.fromEntries(families.map((name, i) => [name, numberCell(r[i + 3])]));
      const extra = aug.slice(1).find(row => row[0] === r[2]);
      if (extra) conditions.forEach((name, i) => { metrics[name] = numberCell(extra[i + 1].split(' ')[0]); });
      return { model, harness: r[1] === r[2] ? undefined : r[1], score: numberCell(r[9]), metrics };
    });
    return checked(rows, 12);
  },
};
export default board;
