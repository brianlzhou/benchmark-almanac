import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';
const URL = 'https://arxiv.org/html/2507.07999';
const board: Leaderboard = {
  benchmark: 'treebench', static: 'paper', parts: {
  Attributes: { name: 'Attributes', group: 'Task type' },
  Material: { name: 'Material', group: 'Task type' },
  OCR: { name: 'OCR', group: 'Task type' },
  Ordering: { name: 'Ordering', group: 'Task type' },
  Comparison: { name: 'Comparison', group: 'Task type' },
  'Phy. State': { name: 'Physical state', group: 'Task type' },
  'Obj. Retr.': { name: 'Object retrieval', group: 'Task type' },
  'Per. Trans.': { name: 'Perspective transformation', group: 'Task type' },
  'Con. & Oc.': { name: 'Contact and occlusion', group: 'Task type' },
  'Spa. Cont.': { name: 'Spatial containment', group: 'Task type' },
}, url: URL, feed: URL + ' (Table 2 overall accuracy)', terms: PAPER_TERMS,
  stats: { mIoU: { name: 'Mean intersection over union', unit: 'score', better: 'higher', note: 'Mean intersection over union between predicted and ground-truth object regions.' } },
  aliases: {'Gemini-2.5-Flash-0520': 'gemini-2-5-flash-may-2025', 'GPT-4o-1120': 'gpt-4o-nov-2024', 'Gemini-2.5-Pro-0605': 'gemini-2-5-pro-jun-2025', 'o3-0416': 'o3'},
  async fetch() {
    const t = inlinePaperTables(await paperHtml(URL)).find(t => t[1]?.[1] === 'Overall' && t[1]?.[2] === 'mIoU');
    if (!t) throw new Error('TreeBench main table missing');
    const rows: LeaderboardRow[] = []; let group = '';
    for (const r of t.slice(2)) {
      if (r[0].endsWith('Models')) { group = r[0]; continue; }
      if (!/^\d+(\.\d+)?$/.test(r[1])) continue;
      const metrics: Record<string, number> = {};
      if (Number.isFinite(Number(r[2]))) metrics.mIoU = Number(r[2]);
      r.slice(3).forEach((v, i) => metrics[t[0][i + 3]] = Number(v));
      rows.push({model: r[0], score: Number(r[1]), open: group.startsWith('Open-source'),
        harness: group === 'Open-source General Models' ? 'VLMEvalKit' : undefined, metrics});
    }
    if (rows.length < 3) throw new Error('TreeBench has too few models');
    return rows;
  },
};
export default board;
