// The source reports no overall score. The headline is the plain mean of the 5 parts, computed by this importer.
// MS-CXR-T tests whether a model identifies change between chest radiographs. Table 2 reports
// macro accuracy across three progression classes for each of five findings.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const feed = 'https://openaccess.thecvf.com/content/CVPR2023/papers/Bannur_Learning_To_Exploit_Temporal_Structure_for_Biomedical_Vision-Language_Processing_CVPR_2023_paper.pdf';
const board: Leaderboard = {
  benchmark: 'ms-cxr-t', url: feed, feed, static: 'paper',
  terms: 'CVF provides open access to the authors’ paper under the notice at https://openaccess.thecvf.com/.',
  headline: 'The paper reports no overall image classification score, so this is the plain mean of macro accuracy across five findings.',
  parts: {consolidation: 'Consolidation', effusion: 'Pleural effusion', pneumonia: 'Pneumonia', pneumothorax: 'Pneumothorax', edema: 'Edema'},
  async fetch() {
    const text = await pdfText(feed);
    const block = text.split('Table 2. Temporal image classification results')[1]?.split('Method (% of labels)')[1];
    if (!block?.split('\n')[0].includes('Consolidation Pl. effusion Pneumonia Pneumothorax Edema')) throw new Error('Missing finding columns');
    const rows: LeaderboardRow[] = [];
    let pending = '';
    for (const line of block.split('\n').slice(1)) {
      const left = line.slice(0, 113).trim().replace(/^Z&F\s*/, '');
      if (!left || left === 'Supervised') continue;
      if (/^\d+\.\d+ ±/.test(left)) {pending = left; continue;}
      const match = left.match(/^(.*?)\s+(Temporal|ImageNet|Static)(?:\s+(.*))?$/);
      if (!match) break;
      const label = match[1].replace(/\s*\[\d+\]/g, '');
      const values = (match[3] || pending).match(/\d+(?:\.\d+)?(?:\s*±\s*\d+(?:\.\d+)?)?/g);
      pending = '';
      if (values?.length !== 5) throw new Error('Invalid finding scores for ' + label);
      const metrics: Record<string, number> = {};
      let sum = 0;
      for (const [i, key] of Object.keys(board.parts!).entries()) {
        const [mean, spread] = values[i].split(/\s*±\s*/).map(Number);
        metrics[key] = mean;
        sum += mean;
        if (spread !== undefined) metrics[key + 'Spread'] = spread;
      }
      const model = label.startsWith('BioViL-T') ? 'BioViL-T' : label.replace(' w/reg', '');
      const setting = label.includes('(0%)') ? 'Zero-shot prompt' : label.includes('(10%)') ? '10% of labels'
        : label.includes('w/reg') ? 'Supervised, affine registration' : label.includes('wout curation') ? 'Supervised, without curation' : 'Supervised';
      if (model === 'CNN + Transformer') continue;
      rows.push({model, setting, score: sum / 5, metrics, trials: model === 'CheXRelNet' ? undefined : 4});
    }
    return checked(rows, 7);
  },
};
export default board;
