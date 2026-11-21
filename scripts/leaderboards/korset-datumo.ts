// The source reports no overall score. The headline is the plain mean of the 5 parts, computed by this importer.
// Table 3 reports the unsafe-response rate on five Korean risk categories for each target model and evaluation setting.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2602.20170';
const board: Leaderboard = {
  benchmark: 'korset-datumo', url: feed, feed, static: 'paper',
  terms: 'The authors publish these results under the terms at https://arxiv.org/abs/2602.20170.',
  aliases: { 'exaone3.5-7.8B-it': 'exaone-3-5-7-8b-instruct' },
  headline: 'The headline is the plain mean of the five risk-category rates in Table 3.',
  async fetch() {
    const table = flatPaperTables(await paperHtml(feed)).map(grid).find(t =>
      t[0]?.join('|') === 'Taxonomy|Attacker|Llama3.1-8B|Qwen2.5-7B|gemma2-9B-it|exaone3.5-7.8B-it|gemma3-12B-it');
    if (!table) throw new Error('Missing KorSET results table');
    const rows: LeaderboardRow[] = [];
    const categories = [...new Set(table.slice(1).map(r => r[0]))];
    if (categories.length !== 5) throw new Error('KorSET risk taxonomy changed');
    board.parts = Object.fromEntries(categories.map(name => [name, name]));
    for (const [i, model] of table[0].slice(2).entries()) {
      const settings = new Map<string, Record<string, number>>();
      for (const [topic, setting, ...cells] of table.slice(1)) {
        const metrics = settings.get(setting) ?? {};
        if (topic in metrics) throw new Error('Duplicate category');
        metrics[topic] = numberCell(cells[i]);
        settings.set(setting, metrics);
      }
      for (const [setting, metrics] of settings) {
        const values = Object.values(metrics);
        if (values.length === 5) rows.push({ model, setting, metrics, score: values.reduce((sum, n) => sum + n, 0) / 5 });
      }
    }
    return checked(rows, 25);
  },
};
export default board;
