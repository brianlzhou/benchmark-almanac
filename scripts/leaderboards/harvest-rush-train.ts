// Harvest Rush Training Evaluation tests priced driving decisions in a farm game.
// The README's held-out table reports mean reward for six named model recipes.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num } from '../lib/html.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const feed = 'https://raw.githubusercontent.com/CompassionML/harvest-rush-train/main/README.md';
export default {
  benchmark: 'harvest-rush-train',
  stats: {
    animalsDrivenOver: { name: 'Animals driven over', unit: '%', better: 'lower' },
    propsDrivenOver: { name: 'Props driven over', unit: '%', better: 'higher' },
    rocksStruck: { name: 'Rocks struck', unit: '%', better: 'lower' },
  },
  url: 'https://github.com/CompassionML/harvest-rush-train',
  feed,
  terms: 'MIT License. https://github.com/CompassionML/harvest-rush-train/blob/main/LICENSE',
  aliases: { 'Qwen2.5-1.5B-Instruct': 'qwen2-5-1-5b' },
  async fetch() {
    const t = await fetchText(feed);
    if (!t.includes('Measured with LoRA on 300 held-out examples')) throw new Error('Results table missing');
    const tbl = markdownTables(t).find((x) => x[0]?.includes('mean reward') && x[0].includes('animals driven over'));
    if (!tbl) throw new Error('Harvest Rush table missing');
    const rows: LeaderboardRow[] = [];
    for (const r of tbl.slice(1)) {
      const recipe = r[0]?.trim();
      const score = num(r[4]);
      if (!recipe || score === undefined) continue;
      const llama = recipe.match(/^Llama 3\.1 8B,\s*(.+)$/);
      const model = llama ? 'Llama 3.1 8B' : 'Qwen2.5-1.5B-Instruct';
      const setting = llama ? llama[1] : recipe;
      const metrics: Record<string, number> = {};
      const animals = num(r[1]);
      const props = num(r[2]);
      const rocks = num(r[3]);
      if (animals !== undefined) metrics.animalsDrivenOver = animals;
      if (props !== undefined) metrics.propsDrivenOver = props;
      if (rocks !== undefined) metrics.rocksStruck = rocks;
      rows.push({ model, setting, score, metrics: Object.keys(metrics).length ? metrics : undefined });
    }
    return checked(rows, 6);
  },
} satisfies Leaderboard;
