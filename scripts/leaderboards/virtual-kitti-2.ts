// The source reports no overall score. The headline is the plain mean of the 50 parts, computed by this importer.
// Tables 14 and 15 test the RGB-trained and depth-trained Adapnet++ semantic segmentation models on five scenes in ten conditions.
import type { Leaderboard, BoardPart } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://europe.naverlabs.com/wp-content/uploads/2020/01/vkitti2.pdf';
const scenes = ['scene01', 'scene02', 'scene06', 'scene18', 'scene20'];
const conditions = ['clone', 'fog', 'morning', 'overcast', 'rain', 'sunset', '15-deg-left', '15-deg-right', '30-deg-left', '30-deg-right'];
const board: Leaderboard = {
  benchmark: 'virtual-kitti-2', static: 'paper', feed, url: feed,
  terms: 'NAVER credits Virtual KITTI 2 under CC BY-NC-SA 3.0. https://creativecommons.org/licenses/by-nc-sa/3.0/',
  headline: 'The paper reports no overall segmentation score, so this is the plain mean of mAP across five scenes and ten conditions.',
  async fetch() {
    const paper = await pdfText(feed);
    const parts: Record<string, BoardPart> = {};
    const rows = ['RGB', 'Depth'].map((setting, i) => {
      const table = paper.split('Table ' + (14 + i) + ': ' + setting + ' semantic segmentation mAP results')[1]?.split('\n\n')[0];
      if (!table || !table.replace(/\s+/g, ' ').includes(scenes.join(' '))) throw new Error('Missing scene columns for ' + setting);
      const metrics: Record<string, number> = {};
      for (const condition of conditions) {
        const cells = table.split('\n').map(line => line.trim().split(/\s+/)).find(c => c[0] === condition);
        if (cells?.length !== 6 || !cells.slice(1).every(c => /^\d+\.\d+$/.test(c))) throw new Error('Missing scores for ' + condition);
        scenes.forEach((scene, j) => {
          const key = scene + '_' + condition.replaceAll('-', '_');
          parts[key] = { name: scene + ': ' + condition, group: 'Semantic segmentation' };
          metrics[key] = Number(cells[j + 1]);
        });
      }
      return { model: 'Adapnet++', setting, score: Object.values(metrics).reduce((a, b) => a + b) / 50, metrics };
    });
    board.parts = parts;
    return checked(rows, 2);
  },
};
export default board;
