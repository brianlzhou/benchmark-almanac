// MammalNet tests recognition of mammals and their behavior in video. Table 2 gives per-class top-1 accuracy.
// The headline uses joint prediction across all 1,036 animal and behavior classes.
import type { BoardPart, Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const feed = 'https://openaccess.thecvf.com/content/CVPR2023/papers/Chen_MammalNet_A_Large-Scale_Video_Benchmark_for_Mammal_Recognition_and_Behavior_CVPR_2023_paper.pdf';
const parts: Record<string, BoardPart> = {};
for (const group of ['Animal Classification', 'Behavior Classification', 'Joint Classification']) {
  for (const name of ['Many', 'Medium', 'Few', 'All']) parts[group + ' ' + name] = { group, name };
}
const board: Leaderboard = {
  benchmark: 'mammalnet', url: 'https://mammal-net.github.io/', feed, static: 'paper', parts,
  terms: 'The authors publish the paper through CVF Open Access at https://openaccess.thecvf.com/menu.',
  async fetch() {
    const source = await pdfText(feed);
    const table = source.match(/Animal Classification\s+Behavior Classification\s+Joint Classification\s+Baselines([\s\S]*?)Table 2\. Per-class Top-1 accuracy/);
    if (!table || !/(?:Many\s+Medium\s+Few\s+All\s*){3}/.test(table[1])) throw new Error('Missing MammalNet Table 2 columns');
    const rows = table[1].split('\n').filter(l => /^\s*[A-Za-z]/.test(l) && !l.includes('Medium')).map(l => {
      const row = l.trim().match(/^(.+?)(?:\s+\[\d+\]|(\*))\s+([\d.\s]+)$/);
      if (!row) throw new Error('Invalid MammalNet results row: ' + l);
      const values = row[3].trim().split(/\s+/).map(Number);
      if (values.length !== 12 || !values.every(Number.isFinite)) throw new Error('Incomplete classification results');
      return { model: row[1], setting: row[2] ? 'Kinetics 400 pretraining' : 'Training from scratch',
        score: values[11], metrics: Object.fromEntries(Object.keys(parts).map((key, i) => [key, values[i]])) };
    });
    return checked(rows, 8);
  },
};
export default board;
