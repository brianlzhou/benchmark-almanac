// ImageNet-UA tests image classifiers against unforeseen adversarial distortions.
// The score is UA2, the mean accuracy across the benchmark's eight core attacks.
// This importer reads Table 1 of the benchmark paper and keeps each attack accuracy.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const URL = 'https://arxiv.org/html/1908.08016v3';
const ATTACKS = ['linf', 'ua2', 'jpeg', 'elastic', 'wood', 'glitch', 'kaleidoscope', 'pixel', 'snow', 'gabor'];

const board: Leaderboard = {
  benchmark: 'imagenet-ua', static: 'paper', url: URL, feed: URL, terms: PAPER_TERMS,
  parts: Object.fromEntries(ATTACKS.slice(1).map((name) => [name, { name, group: 'Attack', unit: '%' }])),
  stats: {
    cleanAccuracy: { name: 'Clean accuracy', unit: '%', better: 'higher' },
    linf: { name: 'L-infinity attack accuracy', unit: '%', better: 'higher' },
  },
  async fetch() {
    const tables = paperTables(await paperHtml(URL)).map(grid);
    const table = tables.find((rows) => rows[0]?.[0] === 'Model' && rows[0]?.includes('UA2'));
    if (!table) throw new Error('ImageNet-UA Table 1 missing');
    const rows: LeaderboardRow[] = [];
    for (const cells of table.slice(1)) {
      const model = cells[0];
      if (!model) continue;
      const values = cells.slice(1).map(Number);
      if (values.length !== 11 || values.some((value) => !Number.isFinite(value))) throw new Error(`ImageNet-UA invalid row: ${model}`);
      const metrics: Record<string, number> = { cleanAccuracy: values[0], linf: values[1], jpeg: values[3], elastic: values[4], wood: values[5], glitch: values[6], kaleidoscope: values[7], pixel: values[8], snow: values[9], gabor: values[10] };
      rows.push({ model, score: values[2], metrics });
    }
    return checked(rows, 10);
  },
};

export default board;
