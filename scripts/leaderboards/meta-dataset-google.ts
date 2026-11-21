// Meta-Dataset evaluates few-shot image classification across ten image datasets.
// The repository reports no single overall accuracy, so this importer uses the plain
// mean of the ten dataset accuracies and keeps each dataset in metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const FEED = 'https://raw.githubusercontent.com/google-research/meta-dataset/master/README.md';
const PARTS = ['ILSVRC (test)', 'Omniglot', 'Aircraft', 'Birds', 'Textures', 'QuickDraw', 'Fungi', 'VGG Flower', 'Traffic signs', 'MSCOCO'];
const board: Leaderboard = {
  benchmark: 'meta-dataset-google',
  url: 'https://github.com/google-research/meta-dataset#leaderboard',
  feed: FEED,
  terms: 'The Meta-Dataset repository is released under Apache 2.0. https://github.com/google-research/meta-dataset/blob/main/LICENSE',
  static: 'paper',
  headline: 'The repository reports no overall score, so this is the plain mean of its ten dataset accuracies.',
  parts: Object.fromEntries(PARTS.map((name) => [name.toLowerCase().replace(/[^a-z0-9]+/g, '_'), { name, group: 'Dataset', unit: '%' }])),
  async fetch(): Promise<LeaderboardRow[]> {
    const text = await fetchText(FEED);
    const rows: LeaderboardRow[] = [];
    let inTable = false;
    for (const line of text.split('\n')) {
      if (line.startsWith('Method') && line.includes('Avg rank') && line.includes('MSCOCO')) {
        inTable = true;
        continue;
      }
      if (inTable && line.startsWith('## ')) inTable = false;
      if (!inTable || !line.includes('|')) continue;
      const cells = line.split('|').map((cell) => cell.trim());
      if (cells.length < 12 || !cells[0] || cells[0] === 'Method' || /^-+$/.test(cells[0])) continue;
      const model = cells[0].replace(/\s*\[\[.*$/, '').trim();
      const values = cells.slice(2, 12).map((cell) => {
        const match = cell.replace(/&nbsp;/g, ' ').match(/(\d+(?:\.\d+)?)(?:±(\d+(?:\.\d+)?))?/);
        return match ? { value: Number(match[1]), error: match[2] ? Number(match[2]) : undefined } : undefined;
      });
      if (!model || values.some((value) => !value)) continue;
      const numeric = values.map((value) => value!.value);
      const metrics: Record<string, number> = {};
      values.forEach((value, index) => {
        metrics[PARTS[index].toLowerCase().replace(/[^a-z0-9]+/g, '_')] = value!.value;
        if (value!.error !== undefined) metrics[`${PARTS[index].toLowerCase().replace(/[^a-z0-9]+/g, '_')}_stderr`] = value!.error;
      });
      rows.push({ model, score: Number((numeric.reduce((sum, value) => sum + value, 0) / numeric.length).toFixed(4)), metrics, setting: rows.length < 18 ? 'training on ImageNet only' : 'training on all datasets' });
    }
    if (rows.length < 30) throw new Error(`Meta-Dataset leaderboard rows missing: ${rows.length}`);
    return rows;
  },
};
export default board;
