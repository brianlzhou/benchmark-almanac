// The source reports no overall score. The headline is the plain mean of the 3 parts, computed by this importer.
// Table 1 compares portrait retouching methods against three experts at each image resolution.
// The headline uses whole-image PSNR in decibels. Color error, human-region measures and consistency stay separate.
import type { Leaderboard, LeaderboardRow, BoardPart } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://openaccess.thecvf.com/content/CVPR2021/papers/Liang_PPR10K_A_Large-Scale_Portrait_Photo_Retouching_Dataset_With_Human-Region_Mask_CVPR_2021_paper.pdf';
const measures = ['PSNR', 'Color error', 'Human-region PSNR', 'Human-region color error', 'Group-level color consistency'];
const parts: Record<string, BoardPart> = {};
for (const expert of ['a', 'b', 'c']) {
  for (const measure of measures) {
    parts[expert + measure] = { name: 'Expert ' + expert.toUpperCase() + ': ' + measure, group: measure,
      unit: 'score', better: measure.includes('PSNR') ? 'higher' : 'lower' };
  }
}
export default {
  benchmark: 'ppr10k', static: 'paper', url, feed: url, parts,
  headline: 'The paper reports no overall PSNR, so this is the mean across the three expert retouches at the stated resolution.',
  terms: 'CVF hosts the authors’ paper for open access. https://openaccess.thecvf.com/CVPR2021',
  async fetch() {
    const text = (await pdfText(url)).split('Table 1: Quantitative comparisons')[1]?.split('Table 2: Quantitative results')[0];
    if (!text?.includes('P SN R') || !text.includes('MGLC') || !text.includes('LR     HR')) throw new Error('Missing Table 1 metrics');
    const models = new Map<string, LeaderboardRow>();
    const rows = [...text.matchAll(/^\s*\d+\s+(.+?)\s+PPR10K-([abc])\s+([\d. \t]+)$/gm)];
    if (rows.length !== 18) throw new Error('Expected 18 model and expert combinations');
    for (const [, label, expert, cells] of rows) {
      const model = label.trim().replace(/\s+\[\d+\]$/, '');
      const numbers = cells.trim().split(/\s+/).map(Number);
      if (numbers.length !== 10 || !numbers.every(Number.isFinite)) throw new Error('Invalid retouching metrics');
      for (const [resolution, setting] of ['360p', 'Original resolution'].entries()) {
        const key = model + '|' + setting;
        const row = models.get(key) ?? { model, setting, score: 0, metrics: {} };
        const metrics = row.metrics!;
        if (expert + 'PSNR' in metrics) throw new Error('Duplicate expert scores');
        measures.forEach((name, i) => { metrics[expert + name] = numbers[2 * i + resolution]; });
        models.set(key, row);
      }
    }
    for (const row of models.values()) {
      const m = row.metrics!;
      row.score = (m.aPSNR + m.bPSNR + m.cPSNR) / 3;
    }
    return checked([...models.values()], 12);
  },
} satisfies Leaderboard;
