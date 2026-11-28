// YANAMI evaluates unified multimodal models on multi-turn stateful visual understanding, generation, and editing.
// Table 1 of arXiv:2611.05280 reports Overall scores and four scenario scores (Fusion, Editing, Modeling, Reasoning).
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2611.05280';

const board: Leaderboard = {
  benchmark: 'yanami',
  static: 'paper',
  url: 'https://rowletqwq.github.io/YANAMI/',
  feed,
  terms: 'The authors publish Table 1 on arXiv. https://arxiv.org/abs/2611.05280',
  aliases: {
    'Nano Banana 2': 'gemini-3-1-flash-image',
    'Step1X-v1p2': 'step1x-edit-v1-2',
    'Qwen-Edit': 'qwen-image-edit',
    'Janus-Pro': 'janus-pro-7b',
    BAGEL: 'bagel-7b-mot',
  },
  parts: {
    fusion: { name: 'Multi-Image Fusion', group: 'Scenario' },
    editing: { name: 'Image Editing', group: 'Scenario' },
    modeling: { name: 'World Modeling', group: 'Scenario' },
    reasoning: { name: 'Visual Reasoning', group: 'Scenario' },
  },
  async fetch() {
    const html = await paperHtml(feed);
    const table = paperTables(html)
      .map(grid)
      .find((t) => t[0]?.includes('Fusion') && t[0]?.includes('Editing') && t[0]?.includes('Overall'));
    if (!table) throw new Error('Missing YANAMI Table 1');
    const hdr = table[0];
    const iModel = hdr.indexOf('Model');
    const iSize = hdr.indexOf('Size');
    const iFus = hdr.indexOf('Fusion');
    const iEdi = hdr.indexOf('Editing');
    const iMod = hdr.indexOf('Modeling');
    const iRea = hdr.indexOf('Reasoning');
    const iOvr = hdr.indexOf('Overall');
    const rows: LeaderboardRow[] = [];
    let prevModel = '';
    for (const cells of table.slice(1)) {
      const rawModel = (cells[iModel] ?? '').replace(/\s*\([^)]*\)\s*$/g, '').trim();
      if (!rawModel) continue;
      const model = rawModel.startsWith('+') && prevModel ? `${prevModel} ${rawModel}` : rawModel;
      if (!rawModel.startsWith('+')) prevModel = rawModel;
      const clean = (s: string) => s.replace(/\\uparrow|\\downarrow|↑|↓/g, '').trim();
      const score = numberCell(clean(cells[iOvr] ?? ''));
      const fusion = numberCell(clean(cells[iFus] ?? ''));
      const editing = numberCell(clean(cells[iEdi] ?? ''));
      const modeling = numberCell(clean(cells[iMod] ?? ''));
      const reasoning = numberCell(clean(cells[iRea] ?? ''));
      const row: LeaderboardRow = {
        model,
        score,
        metrics: { fusion, editing, modeling, reasoning },
      };
      const sizeMatch = (cells[iSize] ?? '').match(/^([\d.]+)\s*B$/i);
      if (sizeMatch) row.params = Number(sizeMatch[1]);
      rows.push(row);
    }
    return checked(rows, 15);
  },
};

export default board;
