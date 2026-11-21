// The source reports no overall score. The headline is the plain mean of the 4 parts, computed by this importer.
// TAP-Vid tests point tracking and visibility across video frames. Table 3 gives Average Jaccard, position accuracy, and occlusion accuracy.
// Two models ran on only a random subset of Kinetics and are omitted from the full-benchmark comparison.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://proceedings.neurips.cc/paper_files/paper/2022/file/58168e8a92994655d6da3939e7cc0918-Paper-Datasets_and_Benchmarks.pdf';
const datasets = ['Kinetics', 'Kubric', 'DAVIS', 'RGB-Stacking'];
const measures = ['Average Jaccard', 'Position accuracy', 'Occlusion accuracy'];
const board: Leaderboard = {
  benchmark: 'tap-vid', url: 'https://tapvid.github.io/', feed, static: 'paper',
  terms: 'The authors publish Table 3 in the NeurIPS proceedings. https://proceedings.neurips.cc/paper_files/paper/2022',
  headline: 'The paper reports no overall score. This is the plain mean of Average Jaccard across four datasets.',
  async fetch() {
    const paper = await pdfText(feed);
    const table = paper.match(/Kinetics\s+Kubric\s+DAVIS\s+RGB-Stacking\s+[\s\S]*?Table 3: Comparison of TAP-Net/)?.[0];
    if (!table || !/Method\s+AJ/.test(table) || !table.includes('OA')) throw new Error('TAP-Vid Table 3 missing');
    const rows: LeaderboardRow[] = [];
    const parts: Record<string, string> = {};
    for (const line of table.split('\n')) {
      if (!/^\s*(COTR|Kubric-VFS-Like|RAFT|PIPs|TAP-Net)\b/.test(line) || line.includes('∗')) continue;
      const [model, ...cells] = line.trim().replace(/\s*\[\d+\]/, '').split(/\s+/);
      const values = cells.map(Number);
      if (values.length !== 12 || !values.every(Number.isFinite)) throw new Error('Invalid TAP-Vid row ' + model);
      const metrics: Record<string, number> = {};
      values.forEach((v, i) => {
        const dataset = datasets[Math.floor(i / 3)];
        const key = dataset.replace('-', '') + ['AJ', 'Position', 'Occlusion'][i % 3];
        parts[key] = dataset + ': ' + measures[i % 3];
        metrics[key] = v;
      });
      rows.push({ model, score: (values[0] + values[3] + values[6] + values[9]) / 4, metrics });
    }
    board.parts = parts;
    return checked(rows, 3);
  },
};
export default board;
