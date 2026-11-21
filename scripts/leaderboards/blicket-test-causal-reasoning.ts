// Blicket causal reasoning evaluates model-guided exploration of hidden rules.
// The paper reports four normalized exploration metrics for four and eight objects.
// This importer uses the plain mean of all eight reported parts as the headline.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://arxiv.org/html/2505.09614';
const board: Leaderboard = {
  benchmark: 'blicket-test-causal-reasoning',
  static: 'paper',
  url: FEED,
  feed: FEED,
  terms: PAPER_TERMS,
  headline: 'The paper reports four normalized exploration metrics for two object counts, so this is their plain mean.',
  async fetch(): Promise<LeaderboardRow[]> {
    const table = paperTables(await paperHtml(FEED)).map(grid).find((t) => t[0]?.join('|') === '# Objs|Model|Disj.|Conj.|Norm. Disj.|Norm. Conj.');
    if (!table) throw new Error('Blicket results table missing');
    const byModel = new Map<string, number[]>();
    const metrics = new Map<string, Record<string, number>>();
    let objects = '';
    for (const row of table.slice(1)) {
      if (row.length < 6) continue;
      if (/^\d+$/.test(row[0])) objects = row[0];
      const model = row[1];
      if (!model || /^(?:baseline random|infoGain oracle)$/i.test(model)) continue;
      const values = row.slice(2, 6).map((cell) => Number(cell.split('±')[0].trim()));
      if (values.length !== 4 || values.some((value) => !Number.isFinite(value))) throw new Error(`Invalid Blicket row: ${row.join('|')}`);
      const key = model.toLowerCase() === 'gpt-4o' ? 'GPT-4o (snapshot unspecified)' : model.toLowerCase() === 'gpt-4o-mini' ? 'GPT-4o-mini (snapshot unspecified)' : model;
      const parts = metrics.get(key) ?? {};
      ['disjunctive', 'conjunctive', 'normalizedDisjunctive', 'normalizedConjunctive'].forEach((name, index) => { parts[`${objects}Objects${name[0].toUpperCase()}${name.slice(1)}`] = values[index]; });
      metrics.set(key, parts);
      byModel.set(key, [...(byModel.get(key) ?? []), ...values]);
    }
    const rows = [...byModel].map(([model, values]) => ({ model, score: values.reduce((sum, value) => sum + value, 0) / values.length, metrics: metrics.get(model) }));
    return checked(rows, 4);
  },
};
export default board;
