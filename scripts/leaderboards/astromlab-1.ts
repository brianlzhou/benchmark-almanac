// AstroMLab tests astronomy knowledge with multiple-choice questions.
// Tables 1 and 2 give overall accuracy. Tables 3 through 6 break it down by subfield and ability.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2407.11194';
const topics = ['Solar & Stellar', 'Earth & Planetary', 'Galactic Astrophysics', 'Cosmology & Nongalactic', 'High Energy Astrophysics', 'Instrumentation & Methods'];
const abilities = ['Understanding Fundamental Concepts', 'Technical & Observational Techniques', 'Analytical & Reasoning Skills', 'Historical & Theoretical Knowledge', 'Advanced Topics'];
const scoreCell = (cell: string) => numberCell(cell.replace(/\s*•/g, '').trim());
const board: Leaderboard = {
  benchmark: 'astromlab-1', static: 'paper', url: feed, feed,
  terms: 'The authors publish the tables through arXiv under its distribution terms. https://arxiv.org/licenses/nonexclusive-distrib/1.0/',
  parts: Object.fromEntries([...topics, ...abilities].map(name => [name, { name, group: topics.includes(name) ? 'Subfield' : 'Tested ability' }])),
  stats: {
    costPer100kTokens: { name: 'Cost per 100,000 tokens', unit: 'usd', better: 'lower' },
    costPer3bTokens: { name: 'Cost per 3 billion tokens', unit: 'usd', better: 'lower' },
  },
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const rows = new Map<string, LeaderboardRow>();
    for (const table of tables.filter(t => t[0][1] === 'Score (%)')) {
      for (const [model, value, price, bulk] of table.slice(1)) {
        if (model === value) continue;
        const metrics: Record<string, number> = {};
        if (price.startsWith('$')) {
          metrics.costPer100kTokens = Number(price.slice(1));
          metrics.costPer3bTokens = Number(bulk.slice(1).replaceAll(',', ''));
        }
        rows.set(model, { model, score: scoreCell(value), metrics });
      }
    }
    for (const names of [topics, abilities]) {
      const depth = names === topics ? 2 : 3;
      const selected = tables.filter(t => t[0][1] === names[0].split(' ')[0] || (names === topics && t[0][1] === 'Solar &'));
      if (selected.length !== 2) throw new Error('Missing subfield or ability tables');
      for (const t of selected) {
        if (!names.every((name, i) => t.slice(0, depth).map(r => r[i + 1]).filter(Boolean).join(' ') === name)) throw new Error('Part columns changed');
        for (const [model, ...values] of t.slice(depth)) {
          if (model === values[0]) continue;
          // The part tables name v0.3 where the overall table names v0.1.
          if (model === 'Mixtral-8x22B-v0.3') continue;
          const row = rows.get(model);
          if (!row) throw new Error('Missing overall score for ' + model);
          names.forEach((name, i) => { row.metrics![name] = scoreCell(values[i]); });
        }
      }
    }
    return checked([...rows.values()], 59);
  },
};
export default board;
