// YouTube-VIS evaluates video instance segmentation and tracking.
// The headline is validation-set AP, with test-set AP and the other published measures in metrics.
// This importer reads the benchmark paper's quantitative comparison table.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const URL = 'https://arxiv.org/html/1905.04804';
const board: Leaderboard = {
  benchmark: 'youtube-vis', static: 'paper', url: URL, feed: URL, terms: PAPER_TERMS,
  stats: { validationAp50: { name: 'Validation AP at IoU 0.50', unit: '%', better: 'higher' }, validationAp75: { name: 'Validation AP at IoU 0.75', unit: '%', better: 'higher' }, validationAr1: { name: 'Validation average recall at one detection', unit: '%', better: 'higher' }, validationAr10: { name: 'Validation average recall at ten detections', unit: '%', better: 'higher' }, testAp: { name: 'Test average precision', unit: '%', better: 'higher' }, testAp50: { name: 'Test AP at IoU 0.50', unit: '%', better: 'higher' }, testAp75: { name: 'Test AP at IoU 0.75', unit: '%', better: 'higher' }, testAr1: { name: 'Test average recall at one detection', unit: '%', better: 'higher' }, testAr10: { name: 'Test average recall at ten detections', unit: '%', better: 'higher' } },
  async fetch() {
    const table = flatPaperTables(await paperHtml(URL)).map(grid).find(rows => rows[0]?.[0] === 'Methods' && rows.some(r => r.includes('MaskTrack R-CNN')));
    if (!table) throw new Error('YouTube-VIS comparison table missing');
    const rows: LeaderboardRow[] = [];
    for (const row of table.slice(1)) {
      const model = row[1]?.trim();
      const score = Number(row[2]);
      if (!model || !Number.isFinite(score) || /^(validation set|test set|Mask propagation|Track-by-detect)$/.test(model)) continue;
      rows.push({ model, harness: row[0], score, metrics: { validationAp50: Number(row[3]), validationAp75: Number(row[4]), validationAr1: Number(row[5]), validationAr10: Number(row[6]), testAp: Number(row[7]), testAp50: Number(row[8]), testAp75: Number(row[9]), testAr1: Number(row[10]), testAr10: Number(row[11]) } });
    }
    return checked(rows, 2);
  },
};
export default board;
