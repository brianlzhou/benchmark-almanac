import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';
const URL = 'https://arxiv.org/html/2608.21357';
const magnitude = (s: string) => parseFloat(s) * (/M$/.test(s) ? 1e6 : /k$/.test(s) ? 1e3 : 1);
const board: Leaderboard = {
  benchmark: 'vials', static: 'paper', parts: {
  Blotting: { name: 'Blotting', group: 'Category' },
  'Flow Cytometry': { name: 'Flow cytometry', group: 'Category' },
  'Molecular Structure': { name: 'Molecular structure', group: 'Category' },
  Phylogenetics: { name: 'Phylogenetics', group: 'Category' },
  'Plasmid Maps': { name: 'Plasmid maps', group: 'Category' },
  'Protein Structure': { name: 'Protein structure', group: 'Category' },
  Other: { name: 'Other', group: 'Category' },
  'Cell Count. / Quant.': { name: 'Cell counting and quantification', group: 'Category' },
}, url: URL, feed: URL + ' (original 161-task VIALS, Table 4 and A1)', terms: PAPER_TERMS,
  stats: { totalTokens: { name: 'Total tokens', unit: 'tokens' }, gain: { name: 'Tool-assisted accuracy gain', unit: '%', better: 'higher', note: 'Absolute accuracy improvement from direct VLM to the tool-assisted agent.' } },
  async fetch() {
    const ts = inlinePaperTables(await paperHtml(URL));
    const t = ts.find(t => t[0]?.[2] === 'Direct VLM');
    const costs = ts.find(t => t[0]?.[2] === 'Cost D');
    const categories = ts.find(t => t[0]?.[1] === 'Blotting');
    if (!t || !costs || !categories) throw new Error('VIALS tables missing');
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(1)) {
      const c = costs.find(c => c[0] === r[0] && c[1] === r[1]);
      if (!c) throw new Error('VIALS cost row missing');
      if (!rows.some(x => x.model === r[0] && x.setting === 'direct VLM')) {
        const cat = categories.find(c => c[0] === r[0]);
        rows.push({model: r[0], score: Number(r[2]), setting: 'direct VLM', trials: 3,
          cost: parseFloat(c[2].replace('$', '')), metrics: {totalTokens: magnitude(r[5]),
            ...Object.fromEntries((cat?.slice(1) ?? []).map((s, i) => [categories[0][i + 1], parseFloat(s)]))}});
      }
      rows.push({model: r[0], score: Number(r[3]), harness: r[1], setting: 'tool-assisted', trials: 3,
        cost: parseFloat(c[3].replace('$', '')), metrics: {totalTokens: magnitude(r[6]), gain: parseFloat(r[4].replace(/\s/g, ''))}});
    }
    if (rows.length < 3) throw new Error('VIALS results missing');
    return rows;
  },
};
export default board;
