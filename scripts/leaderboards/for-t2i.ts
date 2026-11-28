// FoR-T2I evaluates whether text-to-image models render spatial relations from an oriented anchor object's frame of reference.
// Table 1 of arXiv:2608.03357 reports Avg. FoR accuracy (%) and camera-view control accuracy (%) across difficulty levels L1, L2, and L3 for 22 models.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2608.03357';

const board: Leaderboard = {
  benchmark: 'for-t2i',
  static: 'paper',
  url: 'https://ernie-research.github.io/FoR-T2I/',
  feed,
  terms: 'Baidu ERNIE Research publishes Table 1 on arXiv. https://arxiv.org/abs/2608.03357',
  aliases: {
    'Gemini 3 Pro Image': 'gemini-3-pro-image-preview-nano-banana-pro',
    'Gemini 2.5 Flash Image': 'gemini-2-5-flash-image-preview-nano-banana',
    'Z-Image Turbo': 'z-image-turbo',
  },
  parts: {
    l1For: { name: 'L1 (FoR)', group: 'Difficulty', note: 'Single-relation frame-of-reference prompts.' },
    l2For: { name: 'L2 (FoR)', group: 'Difficulty', note: 'Two-relation frame-of-reference prompts.' },
    l3For: { name: 'L3 (FoR)', group: 'Difficulty', note: 'Multi-step frame-of-reference prompts.' },
    l1Cam: { name: 'L1 (Camera)', group: 'Camera control', note: 'Camera-view control prompts at level L1.' },
    l2Cam: { name: 'L2 (Camera)', group: 'Camera control', note: 'Camera-view control prompts at level L2.' },
    l3Cam: { name: 'L3 (Camera)', group: 'Camera control', note: 'Camera-view control prompts at level L3.' },
  },
  stats: {
    camAvg: { name: 'Camera-view control', unit: '%', better: 'higher', note: 'Average accuracy on paired camera-frame control prompts.' },
  },
  async fetch() {
    const html = await paperHtml(feed);
    const table = paperTables(html)
      .map(grid)
      .find((t) => t[1]?.[0] === 'Model' && t[1]?.[1] === 'Cam' && t[1]?.[2] === 'FoR' && t[0]?.includes('L1') && t[0]?.includes('L3'));
    if (!table) throw new Error('Missing FoR-T2I Table 1');
    const rows: LeaderboardRow[] = [];
    for (const cells of table.slice(2)) {
      const model = (cells[0] ?? '').trim();
      if (!model || model === cells[1] || /models$/i.test(model)) continue;
      const camAvg = numberCell(cells[1] ?? '');
      const score = numberCell(cells[2] ?? '');
      const l1Cam = numberCell(cells[3] ?? '');
      const l1For = numberCell(cells[4] ?? '');
      const l2Cam = numberCell(cells[5] ?? '');
      const l2For = numberCell(cells[6] ?? '');
      const l3Cam = numberCell(cells[7] ?? '');
      const l3For = numberCell(cells[8] ?? '');
      if (!Number.isFinite(score)) continue;
      rows.push({
        model,
        score,
        metrics: { l1For, l2For, l3For, l1Cam, l2Cam, l3Cam, camAvg },
      });
    }
    return checked(rows, 22);
  },
};

export default board;
