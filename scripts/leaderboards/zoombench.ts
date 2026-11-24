// ZoomBench evaluates fine-grained multimodal perception on high-resolution images.
// Table 2 of arXiv:2602.11858 reports ZoomBench Global accuracy (%) for 13 models, and Table 7 breaks down 6 perception dimensions plus Regional accuracy and Zooming Gap.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2602.11858';

const normalizeKey = (s: string) => s.toLowerCase().replace(/\([^)]*\)/g, '').replace(/[^a-z0-9]/g, '');

const board: Leaderboard = {
  benchmark: 'zoombench',
  static: 'paper',
  url: 'https://github.com/inclusionAI/Zooming-without-Zooming',
  feed,
  terms: 'The authors publish Tables 2 and 7 on arXiv. https://arxiv.org/abs/2602.11858',
  aliases: {
    'Qwen3-VL-4B': 'qwen3-vl-4b-instruct',
    'Qwen3-VL-8B': 'qwen3-vl-8b-instruct',
    'MiniCPM-V-4.5': 'minicpm-v-4-5',
  },
  parts: {
    counting: { name: 'Counting', group: 'Dimension' },
    ocr: { name: 'OCR', group: 'Dimension' },
    color: { name: 'Color', group: 'Dimension' },
    structure: { name: 'Structure', group: 'Dimension' },
    material: { name: 'Material', group: 'Dimension' },
    identification: { name: 'Identification', group: 'Dimension' },
  },
  stats: {
    regionalAvg: { name: 'Regional accuracy', unit: '%', better: 'higher', note: 'Average accuracy when given cropped target regions instead of the full image.' },
    zoomingGap: { name: 'Zooming gap', unit: '%', better: 'lower', note: 'Difference between regional accuracy and global accuracy.' },
  },
  async fetch() {
    const html = await paperHtml(feed);
    const allTables = paperTables(html).map(grid);
    const t2 = allTables.find((t) => t[1]?.includes('ZoomBench') && t[1]?.includes('HR-4K') && t[1]?.includes('VStar'));
    if (!t2) throw new Error('Missing ZoomBench Table 2');
    const iZoom = t2[1].indexOf('ZoomBench');
    const rows: LeaderboardRow[] = [];
    const byKey = new Map<string, LeaderboardRow>();

    for (const cells of t2.slice(2)) {
      const raw = (cells[0] ?? '').trim();
      if (!raw || raw === cells[1] || /Models$/i.test(raw)) continue;
      const val = numberCell(cells[iZoom] ?? '');
      if (!Number.isFinite(val)) continue;
      const paramMatch = raw.match(/\(([\d.]+)\s*([BT])\)/i);
      const model = raw.replace(/\s*\([^)]*\)\s*$/g, '').trim();
      const row: LeaderboardRow = { model, score: val };
      if (paramMatch) {
        row.params = paramMatch[2].toUpperCase() === 'T' ? Number(paramMatch[1]) * 1000 : Number(paramMatch[1]);
      }
      rows.push(row);
      byKey.set(normalizeKey(model), row);
    }

    const t7 = allTables.find((t) => t[1]?.includes('Counting') && t[1]?.includes('Identification') && t[0]?.includes('Dual-View'));
    if (t7) {
      const h = t7[1];
      const idx = {
        counting: h.indexOf('Counting'),
        ocr: h.indexOf('OCR'),
        color: h.indexOf('Color'),
        structure: h.indexOf('Structure'),
        material: h.indexOf('Material'),
        identification: h.indexOf('Identification'),
        avg: h.lastIndexOf('Avg'),
      };
      for (const cells of t7.slice(2)) {
        const name = (cells[0] ?? '').trim();
        const view = (cells[1] ?? '').trim();
        const key = normalizeKey(name.replace('MiniCPM-4.5-V', 'MiniCPM-V-4.5').replace('Qwen3-VL-235B', 'Qwen3-VL-235B-A22B'));
        const row = byKey.get(key);
        if (!row) continue;
        row.metrics = row.metrics ?? {};
        if (view === 'Global') {
          for (const dim of ['counting', 'ocr', 'color', 'structure', 'material', 'identification'] as const) {
            const v = numberCell(cells[idx[dim]] ?? '');
            if (Number.isFinite(v)) row.metrics[dim] = v;
          }
        } else if (view === 'Regional') {
          const v = numberCell(cells[idx.avg] ?? '');
          if (Number.isFinite(v)) row.metrics.regionalAvg = v;
        } else if (view === 'Zooming Gap') {
          const v = numberCell(cells[idx.avg] ?? '');
          if (Number.isFinite(v)) row.metrics.zoomingGap = v;
        }
      }
    }

    return checked(rows, 13);
  },
};

export default board;
