// VISOR evaluates object segmentation in egocentric kitchen videos. J&F averages region overlap and boundary accuracy.
// The 2025 organizers link the winning teams' reports. We read only the final test submissions, excluding validation and ablation runs.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://epic-kitchens.github.io/2025';
const base = 'https://epic-kitchens.github.io/static/results2025/Reports/';
const board: Leaderboard = {
  benchmark: 'epic-kitchens-visor-semi-supervised-vos', url, feed: base + 'VOS-R1.pdf', static: 'paper', harnesses: 'system',
  parts: {
    regionOverlap: { name: 'Region overlap (J)', unit: '%' },
    boundaryAccuracy: { name: 'Boundary accuracy (F)', unit: '%' },
  },
  terms: 'The organizers publish these team reports for the 2025 challenge. ' + url,
  async fetch() {
    const first = await pdfText(base + 'VOS-R1.pdf');
    await new Promise(resolve => setTimeout(resolve, 1050));
    const second = await pdfText(base + 'VOS-R2.pdf');
    const win = first.match(/Hiera-L \(SAM2\)\s+✓\s+✓\s+([\d.]+)%\s+([\d.]+)%\s+([\d.]+)%/);
    const runner = second.match(/Finally, the\s+J&F-Mean on the test set reached ([\d.]+)%/);
    if (!win || !runner || !first.includes('Ablations on the VISOR test set') || !second.includes('SAM2 for EPIC-KITCHENS')) throw new Error('Missing test scores');
    return checked([
      { model: 'Hiera-L (SAM2)', models: ['Hiera-L (SAM2)', 'Depth Anything V2'], harness: 'Cutie', submitter: 'THU-Warwick',
        setting: 'Flip and multiscale', score: Number(win[1]), metrics: { regionOverlap: Number(win[2]), boundaryAccuracy: Number(win[3]) }, link: base + 'VOS-R1.pdf' },
      { model: 'SAM2', submitter: 'Xidian University', harness: 'Xidian University', setting: 'Train and validation fine-tuning',
        score: Number(runner[1]), link: base + 'VOS-R2.pdf' },
    ], 2);
  },
};
export default board;
