// MOSE tests video object segmentation in complex scenes. Tables 3 to 6 score the original validation set.
// The headline is the authors' mean of region similarity and contour accuracy in each evaluation setting.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://openaccess.thecvf.com/content/ICCV2023/papers/Ding_MOSE_A_New_Dataset_for_Video_Object_Segmentation_in_Complex_ICCV_2023_paper.pdf';
const board: Leaderboard = {
  benchmark: 'mose', static: 'paper', url: 'https://henghuiding.github.io/MOSE/MOSEv1/', feed,
  terms: 'CVF makes the ICCV paper available under the terms at https://openaccess.thecvf.com/menu.',
  async fetch() {
    const pdf = await pdfText(feed);
    const mask = pdf.split('Table 3. Comparisons of state-of-the-art semi-supervised methods')[1]?.split('3.3. Evaluation Metrics')[0];
    const other = pdf.split('Table 4. Comparisons of state-of-the-art box-initialization')[1];
    const [boxAndZero, interactive] = (other ?? '').split('Table 6. Comparisons of state-of-the-art interactive VOS methods');
    if (!mask?.includes('MOSE (ours)') || !boxAndZero.includes('Table 5.') || !interactive?.includes('@60s')) {
      throw new Error('Missing MOSE validation columns');
    }
    const definitions = [
      { text: mask, models: 'AOT STCN RDE SWEM XMem DeAOT', setting: 'Mask initialization' },
      { text: boxAndZero, models: 'SiamMask FTMU', setting: 'Box initialization' },
      { text: boxAndZero, models: 'RVOS AGNN STEm-Seg', setting: 'Zero-shot' },
      { text: interactive.split('on DAVIS 2017')[0], models: 'IPNet STM MANet ATNet GIS MiVOS STCN', setting: 'Interactive, 60 seconds' },
    ];
    const rows: LeaderboardRow[] = [];
    for (const { text, models, setting } of definitions) {
      for (const model of models.split(' ')) {
        const pattern = new RegExp('\\b' + model + ' \\[\\d+\\]\\s+(?:NeurIPS|CVPR|ICCV|ECCV)’\\d+\\s+([\\d.]+(?:[ \\t]+[\\d.]+)+)');
        const cells = text.match(pattern)?.[1].trim().split(/\s+/).map(Number);
        const timed = setting.startsWith('Interactive');
        if (!cells || cells.length < (timed ? 2 : 4)) throw new Error('Missing MOSE scores for ' + model);
        rows.push({ model, setting, score: cells[timed ? 0 : 2],
          ...(timed ? {} : { metrics: { regionSimilarity: cells[0], contourAccuracy: cells[1] } }) });
      }
    }
    return checked(rows, 18);
  },
};
export default board;
